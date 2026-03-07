const AIRTABLE_SCHEMAS = {
  v1_legacy: {
    tables: {
      applicants: "Applicants",
      earnings: "Earnings",
      client: "Client",
      activeEarnings: "Active_Earnings",
    },
    entities: {
      applicants: {
        fields: {
          name: ["Name"],
          email: ["Email"],
          role: ["Role"],
          experience: ["Experience"],
          status: ["Status"],
          resume: ["Resume"],
        },
      },
      earnings: {
        fields: {
          date: ["Date"],
          platform: ["Source"],
          hoursWorked: ["Amount"],
          tags: ["Tags"],
          status: ["Status"],
        },
      },
      client: {
        fields: {
          platform: ["Platform"],
          project: ["Project"],
          ratePerHour: ["Rate_Per_Hour"],
        },
      },
      activeEarnings: {
        fields: {
          platform: ["Platform"],
          project: ["Project"],
          ratePerHour: ["Rate_Per_Hour"],
        },
      },
    },
  },
  v2_current: {
    tables: {
      applicants: "Applicants",
      earnings: "Earnings",
      client: "Client",
      activeEarnings: "Active_Earnings",
    },
    entities: {
      applicants: {
        fields: {
          name: ["Name"],
          email: ["Email"],
          role: ["Role"],
          experience: ["expericence", "Experience"],
          status: ["status", "Status"],
          resume: ["resume", "Resume"],
        },
      },
      earnings: {
        fields: {
          date: ["Date"],
          platform: ["Platform", "Source"],
          hoursWorked: ["Hours Worked", "Amount"],
          tags: ["Tags"],
          status: ["Status", "status"],
        },
      },
      client: {
        fields: {
          platform: ["Platform"],
          project: ["Project"],
          ratePerHour: ["Rate_Per_Hour"],
        },
      },
      activeEarnings: {
        fields: {
          platform: ["Platform"],
          project: ["Project"],
          ratePerHour: ["Rate_Per_Hour"],
        },
      },
    },
  },
};

export const DEFAULT_SCHEMA_VERSION = "v2_current";

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

