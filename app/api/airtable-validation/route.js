import { NextResponse } from 'next/server';
import { fetchAllRecords } from '@/lib/airtable/client';
import { getAirtableSchema } from '@/lib/airtable/schema';
import {
  mapAccountRecord,
  mapEarningRecord,
  mapTransferRecord,
  sortByDateDesc,
} from '@/lib/services/AirtableService';

function errorResponse(status, code, message, details = {}) {
  return NextResponse.json({ error: message, code, details }, { status });
}

export async function GET() {
  const schema = getAirtableSchema();

  const [earningsResponse, accountsResponse, transfersResponse] = await Promise.all([
    fetchAllRecords({ tableName: schema.tables.earnings }),
    fetchAllRecords({ tableName: schema.tables.accounts }),
    fetchAllRecords({ tableName: schema.tables.transfers }),
  ]);

  if (!earningsResponse.ok) {
    return errorResponse(
      earningsResponse.status || 500,
      earningsResponse.error?.code || 'EARNINGS_VALIDATION_READ_FAILED',
      earningsResponse.error?.message || 'Unable to read earnings for validation',
      { table: schema.tables.earnings }
    );
  }

  if (!accountsResponse.ok) {
    return errorResponse(
      accountsResponse.status || 500,
      accountsResponse.error?.code || 'ACCOUNTS_VALIDATION_READ_FAILED',
      accountsResponse.error?.message || 'Unable to read accounts for validation',
      { table: schema.tables.accounts }
    );
  }

  if (!transfersResponse.ok) {
    return errorResponse(
      transfersResponse.status || 500,
      transfersResponse.error?.code || 'TRANSFERS_VALIDATION_READ_FAILED',
      transfersResponse.error?.message || 'Unable to read transfers for validation',
      { table: schema.tables.transfers }
    );
  }

  const earnings = earningsResponse.data.records.map((record) =>
    mapEarningRecord(record, schema.entities.earnings.fields)
  );

  const accounts = accountsResponse.data.records.map((record) =>
    mapAccountRecord(record, schema.entities.accounts.fields)
  );

  const transfers = sortByDateDesc(
    transfersResponse.data.records.map((record) =>
      mapTransferRecord(record, schema.entities.transfers.fields)
    )
  );

  const earningsMissingRequired = earnings
    .filter((entry) => !entry.date || !entry.platform || !entry.project)
    .map((entry) => ({ id: entry.id, date: entry.date, platform: entry.platform, project: entry.project }));

  const accountsMissingCurrentBalance = accounts
    .filter((account) => !Number.isFinite(account.currentBalance))
    .map((account) => ({ id: account.id, accountName: account.accountName }));

  const transfersMissingAccount = transfers
    .filter((transfer) => !transfer.account || transfer.account === 'Unknown Account')
    .map((transfer) => ({ id: transfer.id, date: transfer.date }));

  return NextResponse.json({
    schemaVersion: process.env.AIRTABLE_SCHEMA_VERSION || 'finance_v1',
    checkedAt: new Date().toISOString(),
    summary: {
      earningsChecked: earnings.length,
      accountsChecked: accounts.length,
      transfersChecked: transfers.length,
      earningsMissingRequired: earningsMissingRequired.length,
      accountsMissingCurrentBalance: accountsMissingCurrentBalance.length,
      transfersMissingAccount: transfersMissingAccount.length,
    },
    details: {
      earningsMissingRequired,
      accountsMissingCurrentBalance,
      transfersMissingAccount,
    },
  });
}
