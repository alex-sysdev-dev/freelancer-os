const AIRTABLE_API_BASE = "https://api.airtable.com/v0";

function toErrorMessage(value) {
  if (typeof value === "string") return value;
  if (value && typeof value.message === "string") return value.message;
  return "Unknown Airtable error";
}

export function getAirtableToken() {
  return process.env.AIRTABLE_API_KEY || process.env.AIRTABLE_PERSONAL_ACCESS_TOKEN || "";
}

export function getAirtableConfig() {
  const token = getAirtableToken();
  const baseId = process.env.AIRTABLE_BASE_ID || "";
  const missing = [];

  if (!token) missing.push("AIRTABLE_API_KEY");
  if (!baseId) missing.push("AIRTABLE_BASE_ID");

  return {
    ok: missing.length === 0,
    token,
    baseId,
    missing,
  };
}

function normalizeAirtableError(data, status) {
  const airtableError = data?.error;
  if (airtableError && typeof airtableError === "object") {
    return {
      code: "AIRTABLE_REQUEST_FAILED",
      type: airtableError.type || "UNKNOWN",
      message: toErrorMessage(airtableError),
      status,
    };
  }

  return {
    code: "AIRTABLE_REQUEST_FAILED",
    type: "UNKNOWN",
    message: toErrorMessage(data),
    status,
  };
}

function buildQueryString(query = {}) {
  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value === null || value === undefined || value === "") return;
    params.append(key, String(value));
  });
  const serialized = params.toString();
  return serialized ? `?${serialized}` : "";
}

export async function airtableRequest({
  tableName,
  method = "GET",
  query = {},
  body = null,
}) {
  const config = getAirtableConfig();
  if (!config.ok) {
    return {
      ok: false,
      status: 500,
      error: {
        code: "AIRTABLE_CONFIG_MISSING",
        message: `Missing Airtable configuration: ${config.missing.join(", ")}`,
      },
    };
  }

  const encodedTableName = encodeURIComponent(tableName);
  const url = `${AIRTABLE_API_BASE}/${config.baseId}/${encodedTableName}${buildQueryString(query)}`;
  const headers = {
    Authorization: `Bearer ${config.token}`,
  };

  const requestOptions = {
    method,
    headers,
    next: { revalidate: 0 },
  };

  if (body !== null) {
    headers["Content-Type"] = "application/json";
    requestOptions.body = JSON.stringify(body);
  }

  let response;
  try {
    response = await fetch(url, requestOptions);
  } catch (error) {
    return {
      ok: false,
      status: 502,
      error: {
        code: "AIRTABLE_NETWORK_ERROR",
        message: error instanceof Error ? error.message : "Network request to Airtable failed",
      },
    };
  }

  let data = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    return {
      ok: false,
      status: response.status,
      error: normalizeAirtableError(data, response.status),
      raw: data,
    };
  }

  return { ok: true, status: response.status, data, raw: data };
}

export async function fetchAllRecords({ tableName, query = {} }) {
  const records = [];
  let offset = null;

  do {
    const pageQuery = { ...query };
    if (offset) pageQuery.offset = offset;

    const result = await airtableRequest({ tableName, method: "GET", query: pageQuery });
    if (!result.ok) return result;

    const pageRecords = Array.isArray(result.data?.records) ? result.data.records : [];
    records.push(...pageRecords);
    offset = result.data?.offset || null;
  } while (offset);

  return { ok: true, status: 200, data: { records } };
}

export async function createRecord({ tableName, fields }) {
  return airtableRequest({
    tableName,
    method: "POST",
    body: { fields },
  });
}

