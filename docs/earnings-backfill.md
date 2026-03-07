# Backfill Derived Earnings (12 months)

This project now derives earnings amount as:

`Hours Worked * Rate_Per_Hour`

where `Rate_Per_Hour` resolves from:

1. `Active_Earnings` (primary)
2. `Client` (fallback)

## Recommended one-time backfill workflow

1. Run `GET /api/airtable-validation` and fix all `missingProjectTags` / `missingRates`.
2. Export last 12 months from `Earnings` (with `Date`, `Platform`, `Hours Worked`, `Tags`).
3. Recompute normalized amount using the current `(Platform, Project)` rate lookup.
4. Store results in a dedicated Airtable view/table for reporting acceleration (optional), or let the API compute dynamically.

## Tag format requirement

Every earnings row must include: `project:<name>` in `Tags`.

Examples:
- `project:alpha`
- `project:beta,priority:high`

## Safety notes

- Keep source fields (`Hours Worked`, `Tags`) unchanged for auditability.
- If rate is missing, do not backfill amount for that row until mapping is fixed.
- Re-run `GET /api/airtable-validation` after cleanup to confirm zero blocking issues.
