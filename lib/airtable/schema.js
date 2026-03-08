const AIRTABLE_SCHEMAS = {
  finance_v1: {
    tables: {
      earnings: process.env.AIRTABLE_TABLE_EARNINGS || "Earnings",
      accounts: process.env.AIRTABLE_TABLE_ACCOUNTS || "Accounts",
      transfers: process.env.AIRTABLE_TABLE_TRANSFERS || "Transfers",
    },
    entities: {
      earnings: {
        fields: {
          date: ["Date", "date", "Name"],
          platform: ["Platform", "Source"],
          project: ["Project", "project", "Tags"],
          hoursWorked: ["Hours Worked", "hours worked", "Hours"],
          ratePerHour: ["Rate ($/hr)", "Rate ($ /hr)", "Rate Per Hour", "Rate", "Rate_Per_Hour"],
          calculatedEarnings: ["Calculated Earnings", "calculated earnings", "Amount"],
          weekStartDate: ["Week Start Date", "Week"],
          recordCreatedTime: ["Record Created Time", "Created Time"],
          oneMonthForecast: ["1 Month Earnings Forecast", "1 month earnings forecast"],
          twoWeekForecast: ["2 Week Earnings Forecast", "2 week earnings forecast"],
          sixMonthForecast: ["6 Month Earnings Forecast", "6 month earnings forecast"],
        },
      },
      accounts: {
        fields: {
          name: ["Account Name", "Name"],
          type: ["Type"],
          startingBalance: ["Starting Balance"],
          transfers: ["Transfers"],
          netTransfers: ["Net Transfers"],
          currentBalance: ["Current Balance"],
        },
      },
      transfers: {
        fields: {
          date: ["Date"],
          account: ["Account"],
          accountName: ["Account Name (from Account)", "Account Name (from Accounts)"],
          category: ["Category"],
          amount: ["Amount"],
          signedAmount: ["Signed Amount"],
          source: ["Source"],
          weekStartDate: ["Week Start Date"],
        },
      },
    },
  },
};

export const DEFAULT_SCHEMA_VERSION = "finance_v1";

export function getSchemaVersion() {
  const configured = process.env.AIRTABLE_SCHEMA_VERSION?.trim();
  if (!configured) return DEFAULT_SCHEMA_VERSION;
  return AIRTABLE_SCHEMAS[configured] ? configured : DEFAULT_SCHEMA_VERSION;
}

export function getAirtableSchema() {
  return AIRTABLE_SCHEMAS[getSchemaVersion()];
}

export function getFieldCandidates(schema, entityName, logicalField) {
  return schema?.entities?.[entityName]?.fields?.[logicalField] || [];
}

export function getPreferredFieldName(schema, entityName, logicalField, index = 0) {
  const candidates = getFieldCandidates(schema, entityName, logicalField);
  if (!candidates.length) return null;
  return candidates[index] || candidates[0];
}

export function pickRecordValue(recordFields, candidates = []) {
  if (!recordFields || typeof recordFields !== "object") return undefined;
  for (const fieldName of candidates) {
    if (Object.prototype.hasOwnProperty.call(recordFields, fieldName)) {
      return recordFields[fieldName];
    }
  }
  return undefined;
}
