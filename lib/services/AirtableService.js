import { fetchAllRecords } from "@/lib/airtable/client";
import { pickRecordValue } from "@/lib/airtable/schema";

export function toFiniteNumber(value) {
  if (Array.isArray(value)) {
    for (const item of value) {
      const parsed = toFiniteNumber(item);
      if (Number.isFinite(parsed)) return parsed;
    }
    return null;
  }

  if (value === null || value === undefined) return null;

  if (typeof value === "number") return Number.isFinite(value) ? value : null;

  if (typeof value === "string") {
    const trimmed = value.trim();
    if (!trimmed) return null;

    // Handles duration-like values such as 1:00 or 2:30:00.
    if (trimmed.includes(":")) {
      const parts = trimmed.split(":").map((part) => Number(part));
      if (parts.every((part) => Number.isFinite(part))) {
        if (parts.length === 2) {
          const [hours, minutes] = parts;
          return hours + minutes / 60;
        }
        if (parts.length === 3) {
          const [hours, minutes, seconds] = parts;
          return hours + minutes / 60 + seconds / 3600;
        }
      }
    }

    // Handles values like "$50.00", "50.00, 60.00", or "USD 40".
    const numberLike = trimmed.match(/-?\d+(?:,\d{3})*(?:\.\d+)?/);
    if (numberLike) {
      const parsed = Number(numberLike[0].replace(/,/g, ""));
      return Number.isFinite(parsed) ? parsed : null;
    }

    const parsed = Number(trimmed);
    return Number.isFinite(parsed) ? parsed : null;
  }

  return null;
}

function normalizeKeyPart(value) {
  if (typeof value !== "string") return "";
  return value
    .trim()
    .toLowerCase()
    .replace(/^project:\s*/i, "")
    .replace(/:.+$/, "")
    .replace(/\s+/g, " ")
    .replace(/[^\w\s-]/g, "");
}

function buildRateKey(platform, project) {
  return `${normalizeKeyPart(platform)}::${normalizeKeyPart(project)}`;
}

function normalizeTagInput(tags) {
  if (Array.isArray(tags)) {
    return tags
      .flatMap((value) => (typeof value === "string" ? value.split(",") : []))
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  if (typeof tags === "string") {
    return tags
      .split(",")
      .map((tag) => tag.trim())
      .filter(Boolean);
  }

  return [];
}

export function parseProjectFromTags(tags) {
  const allTags = normalizeTagInput(tags);
  if (!allTags.length) return null;

  for (const tag of allTags) {
    const match = /^project:(.+)$/i.exec(tag);
    if (match?.[1]) return match[1].trim();
  }

  // Fallback for current table values where tags are plain names (e.g. "El Dorado")
  // or descriptive values (e.g. "Apollo: labeler").
  const primary = allTags[0];
  if (!primary) return null;
  return primary.split(":")[0].trim() || null;
}

function toHoursWorked(value) {
  const parsed = toFiniteNumber(value);
  if (!Number.isFinite(parsed)) return null;

  // Airtable Duration fields often return seconds via API.
  if (parsed >= 600 && Number.isInteger(parsed)) {
    return parsed / 3600;
  }

  return parsed;
}

function upsertRateRecord(lookup, record, fieldMap, sourceTable) {
  const fields = record?.fields || {};
  const platform = pickRecordValue(fields, fieldMap.platform);
  const project = pickRecordValue(fields, fieldMap.project);
  const rate = toFiniteNumber(pickRecordValue(fields, fieldMap.ratePerHour));
  if (!platform || !project || !Number.isFinite(rate)) return;

  const key = buildRateKey(platform, project);
  if (!lookup.has(key)) {
    lookup.set(key, { platform, project, ratePerHour: rate, sourceTable });
  }
}

export async function buildRateLookup(schema) {
  const lookup = new Map();
  const issues = [];

  const activeResult = await fetchAllRecords({ tableName: schema.tables.activeEarnings });
  if (activeResult.ok) {
    for (const record of activeResult.data.records) {
      upsertRateRecord(lookup, record, schema.entities.activeEarnings.fields, schema.tables.activeEarnings);
    }
  } else {
    issues.push({
      table: schema.tables.activeEarnings,
      error: activeResult.error?.message || "Unable to read Active_Earnings table",
    });
  }

  const clientResult = await fetchAllRecords({ tableName: schema.tables.client });
  if (clientResult.ok) {
    for (const record of clientResult.data.records) {
      upsertRateRecord(lookup, record, schema.entities.client.fields, schema.tables.client);
    }
  } else {
    issues.push({
      table: schema.tables.client,
      error: clientResult.error?.message || "Unable to read Client table",
    });
  }

  return { lookup, issues };
}

export function mapEarningRecord(record, earningsFieldMap, rateLookup) {
  const fields = record?.fields || {};
  const date = pickRecordValue(fields, earningsFieldMap.date) || null;
  const platform = pickRecordValue(fields, earningsFieldMap.platform) || null;
  const hoursWorked = toHoursWorked(pickRecordValue(fields, earningsFieldMap.hoursWorked));
  const tags = pickRecordValue(fields, earningsFieldMap.tags) || "";
  const status = pickRecordValue(fields, earningsFieldMap.status) || null;
  const project = parseProjectFromTags(tags);

  const lookupKey = project && platform ? buildRateKey(platform, project) : null;
  const matchedRate = lookupKey ? rateLookup.get(lookupKey) : null;
  const ratePerHour = toFiniteNumber(matchedRate?.ratePerHour);

  let warning = null;
  if (!project) warning = "missing_project_tag";
  else if (!Number.isFinite(hoursWorked)) warning = "invalid_hours_worked";
  else if (!Number.isFinite(ratePerHour)) warning = "missing_rate";

  const amount =
    Number.isFinite(hoursWorked) && Number.isFinite(ratePerHour)
      ? Math.round(hoursWorked * ratePerHour * 100) / 100
      : 0;

  return {
    id: record.id,
    source: platform || "Unknown",
    amount,
    date,
    platform,
    project,
    hoursWorked,
    ratePerHour,
    tags,
    status,
    warning,
  };
}

export function sortByDateAsc(records) {
  return [...records].sort((a, b) => {
    const left = a?.date ? new Date(a.date).getTime() : Number.POSITIVE_INFINITY;
    const right = b?.date ? new Date(b.date).getTime() : Number.POSITIVE_INFINITY;
    return left - right;
  });
}
