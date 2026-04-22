/**
 * SaaS data layer using the existing Airtable REST client.
 *
 * Required Airtable tables (create in your base):
 *
 * SaasUsers:   Name (text), Email (email), PasswordHash (text), Plan (text), CreatedAt (text)
 * SaasBots:    Name (text), UserId (text), BusinessType (text), Status (text),
 *              SystemPrompt (long text), WelcomeMessage (text), CreatedAt (text)
 * SaasTraining: BotId (text), Question (text), Answer (long text), Category (text), CreatedAt (text)
 *
 * Optional env vars (default to names above):
 *   AIRTABLE_TABLE_SAAS_USERS, AIRTABLE_TABLE_SAAS_BOTS, AIRTABLE_TABLE_SAAS_TRAINING
 */

import { getAirtableConfig, fetchAllRecords, createRecord } from '@/lib/airtable/client';

const AIRTABLE_API_BASE = 'https://api.airtable.com/v0';

const TABLES = {
  users: process.env.AIRTABLE_TABLE_SAAS_USERS || 'SaasUsers',
  bots: process.env.AIRTABLE_TABLE_SAAS_BOTS || 'SaasBots',
  training: process.env.AIRTABLE_TABLE_SAAS_TRAINING || 'SaasTraining',
};

function cfg() {
  const c = getAirtableConfig();
  if (!c.ok) throw new Error('Airtable not configured: ' + c.missing.join(', '));
  return c;
}

function headers(token) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function recordToObj(r) {
  return { id: r.id, ...r.fields };
}

async function getById(tableName, id) {
  const { token, baseId } = cfg();
  const res = await fetch(`${AIRTABLE_API_BASE}/${baseId}/${encodeURIComponent(tableName)}/${id}`, {
    headers: { Authorization: `Bearer ${token}` },
    next: { revalidate: 0 },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Airtable error');
  return recordToObj(data);
}

async function patchRecord(tableName, id, fields) {
  const { token, baseId } = cfg();
  const res = await fetch(`${AIRTABLE_API_BASE}/${baseId}/${encodeURIComponent(tableName)}/${id}`, {
    method: 'PATCH',
    headers: headers(token),
    body: JSON.stringify({ fields }),
    next: { revalidate: 0 },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error?.message || 'Airtable error');
  return recordToObj(data);
}

async function destroyRecord(tableName, id) {
  const { token, baseId } = cfg();
  const res = await fetch(`${AIRTABLE_API_BASE}/${baseId}/${encodeURIComponent(tableName)}/${id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    const data = await res.json().catch(() => ({}));
    throw new Error(data.error?.message || 'Delete failed');
  }
}

// ─── Users ────────────────────────────────────────────────────────────────────

export async function findUserByEmail(email) {
  const result = await fetchAllRecords({
    tableName: TABLES.users,
    query: { filterByFormula: `{Email} = "${email.replace(/"/g, '\\"')}"` },
  });
  if (!result.ok) throw new Error(result.error?.message || 'Airtable query failed');
  const records = result.data.records || [];
  if (records.length === 0) return null;
  return recordToObj(records[0]);
}

export async function createUser({ name, email, passwordHash }) {
  const result = await createRecord({
    tableName: TABLES.users,
    fields: {
      Name: name,
      Email: email,
      PasswordHash: passwordHash,
      Plan: 'free',
      CreatedAt: new Date().toISOString(),
    },
  });
  if (!result.ok) throw new Error(result.error?.message || 'Failed to create user');
  return recordToObj(result.data);
}

// ─── Bots ─────────────────────────────────────────────────────────────────────

export async function getBotsForUser(userId) {
  const result = await fetchAllRecords({
    tableName: TABLES.bots,
    query: {
      filterByFormula: `{UserId} = "${userId}"`,
      sort: JSON.stringify([{ field: 'CreatedAt', direction: 'desc' }]),
    },
  });
  if (!result.ok) throw new Error(result.error?.message || 'Airtable query failed');
  return (result.data.records || []).map(recordToObj);
}

export async function getBotById(id) {
  return getById(TABLES.bots, id);
}

export async function createBot({ name, userId, businessType, systemPrompt, welcomeMessage }) {
  const result = await createRecord({
    tableName: TABLES.bots,
    fields: {
      Name: name,
      UserId: userId,
      BusinessType: businessType,
      Status: 'active',
      SystemPrompt: systemPrompt || '',
      WelcomeMessage: welcomeMessage || '',
      CreatedAt: new Date().toISOString(),
    },
  });
  if (!result.ok) throw new Error(result.error?.message || 'Failed to create bot');
  return recordToObj(result.data);
}

export async function updateBot(id, fields) {
  const allowed = ['Name', 'Status', 'SystemPrompt', 'WelcomeMessage', 'BusinessType'];
  const safeFields = {};
  for (const key of allowed) {
    if (fields[key] !== undefined) safeFields[key] = fields[key];
  }
  return patchRecord(TABLES.bots, id, safeFields);
}

export async function deleteBot(id) {
  return destroyRecord(TABLES.bots, id);
}

// ─── Training ─────────────────────────────────────────────────────────────────

export async function getTrainingForBot(botId) {
  const result = await fetchAllRecords({
    tableName: TABLES.training,
    query: {
      filterByFormula: `{BotId} = "${botId}"`,
      sort: JSON.stringify([{ field: 'CreatedAt', direction: 'asc' }]),
    },
  });
  if (!result.ok) throw new Error(result.error?.message || 'Airtable query failed');
  return (result.data.records || []).map(recordToObj);
}

export async function addTrainingItem({ botId, question, answer, category }) {
  const result = await createRecord({
    tableName: TABLES.training,
    fields: {
      BotId: botId,
      Question: question,
      Answer: answer,
      Category: category || '',
      CreatedAt: new Date().toISOString(),
    },
  });
  if (!result.ok) throw new Error(result.error?.message || 'Failed to add training item');
  return recordToObj(result.data);
}

export async function deleteTrainingItem(id) {
  return destroyRecord(TABLES.training, id);
}
