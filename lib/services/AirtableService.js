import { fetchAllRecords } from "@/lib/airtable/client";
import { pickRecordValue } from "@/lib/airtable/schema";

export function toFiniteNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (typeof value === "string") {
    const parsed = Number(value.trim());
    return Number.isFinite(parsed) ? parsed : null;
  }
  return null;
}

function normalizeKeyPart(value) {
  if (typeof value !== "string") return "";
  return value.trim().toLowerCase();
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
  for (const tag of allTags) {
    const match = /^project:(.+)$/i.exec(tag);
    if (match?.[1]) return match[1].trim();
  }
  return null;
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
  const hoursWorked = toFiniteNumber(pickRecordValue(fields, earningsFieldMap.hoursWorked));
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
