# CLAUDE.md — Freelancer Finance OS

## Project Overview

**Freelancer Finance OS** is a personal finance dashboard for freelancers to track earnings, account balances, and money transfers. It uses Airtable as the database backend and is built with Next.js 16 (App Router).

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Language | JavaScript (JSX) — no TypeScript in source files |
| Styling | Tailwind CSS 4.2 + PostCSS |
| Database | Airtable (external cloud) |
| Charts | Recharts |
| Icons | Lucide React |
| Font | Plus Jakarta Sans (root layout) |
| Auth | sessionStorage-based password gate |
| Deployment | Vercel (Analytics + Blob integrated) |

---

## Directory Structure

```
app/
  api/                    # Next.js API routes
    earnings/             # GET (list) / POST (create) earnings
    accounts/             # GET (list) / POST (create) accounts
    transfers/            # GET (list) / POST (create) transfers
    airtable-validation/  # GET data integrity validation
  dashboard/              # Protected dashboard pages
    page.js               # Overview KPIs + charts
    earnings/             # Detailed earnings analytics
    accounts/             # Account balances overview
    transfers/            # Transfer history
    forecast/             # Earnings forecasts
  login/                  # Login page
  page.js                 # Public landing page
  layout.js               # Root layout (font, analytics, dark mode)
  globals.css             # CSS variables and global styles

components/
  FinanceAccessGate.js    # Auth gate (locked / admin / preview modes)
  DashboardNav.js         # Sidebar/nav with 5 links
  AddEarningForm.js       # Modal form for new earnings
  AddTransferForm.js      # Modal form for new transfers
  LinkedTile.js           # Reusable card/tile with optional link

lib/
  airtable/
    client.js             # Airtable API client factory
    schema.js             # Field name mapping + schema versions
  services/
    AirtableService.js    # Data mapping and transformation layer
  hooks/
    useFinanceData.js     # Central React hook for all finance data
  finance/
    ui.js                 # USD formatter + chart color constants

docs/                     # Empty (reserved for future docs)
public/logos/             # Static logo assets
```

---

## Environment Variables

Create a `.env.local` file with the following:

```bash
# Airtable — all required for data to load
AIRTABLE_API_KEY=                   # or AIRTABLE_PERSONAL_ACCESS_TOKEN
AIRTABLE_BASE_ID=                   # Airtable base ID (starts with "app")
AIRTABLE_TABLE_EARNINGS=Earnings    # Table name (default: Earnings)
AIRTABLE_TABLE_ACCOUNTS=Accounts    # Table name (default: Accounts)
AIRTABLE_TABLE_TRANSFERS=Transfers  # Table name (default: Transfers)

# Schema
AIRTABLE_SCHEMA_VERSION=finance_v1  # Default schema version
AIRTABLE_HOURS_IS_DURATION=true     # true = hours stored as seconds in Airtable

# Auth (client-side only — not secure for production)
NEXT_PUBLIC_ADMIN_PASSWORD=         # Password to unlock admin mode
```

---

## Development Workflow

```bash
npm run dev    # Start local dev server at localhost:3000
npm run build  # Production build
npm run lint   # Run ESLint
```

No test framework is configured. There are no test files.

---

## Authentication Model

Authentication is handled entirely client-side via `FinanceAccessGate.js`:

- **locked** — default state, shows password form
- **admin** — full read/write access (password matches `NEXT_PUBLIC_ADMIN_PASSWORD`)
- **preview** — read-only mode (accessible from landing page "Preview" button)

Session state is stored in `sessionStorage` keys:
- `finance_admin_unlocked`
- `finance_preview_unlocked`

> This is suitable for personal/hobby use only. Do not treat this as a secure auth system.

---

## Data Layer (Airtable)

### Schema Flexibility
Field names in Airtable can vary. `lib/airtable/schema.js` defines candidate arrays for each field so the service tries multiple names until it finds the right one. When adding new fields, add all likely Airtable column names to the candidate array.

### Schema Version
The `finance_v1` schema (default) defines three tables: **Earnings**, **Accounts**, **Transfers**.

### AirtableService
`lib/services/AirtableService.js` is the single source of truth for mapping raw Airtable records to typed JS objects. All field resolution happens here. Do not access Airtable records directly in API routes.

### Hours Duration Handling
When `AIRTABLE_HOURS_IS_DURATION=true`, Airtable stores hours as seconds (duration field). The service divides by 3600 to convert to hours.

---

## API Routes

All routes are under `app/api/`. They follow a consistent pattern:

- **GET** — fetches and returns mapped records
- **POST** — creates a new record; validates required fields first
- Error responses use `{ error, code, details? }` format

| Route | Methods | Description |
|-------|---------|-------------|
| `/api/earnings` | GET, POST | Earnings records |
| `/api/accounts` | GET, POST | Account records |
| `/api/transfers` | GET, POST | Transfer records |
| `/api/airtable-validation` | GET | Data integrity check |

Stub routes that return 404 (reserved, not implemented):
- `/api/applicants`
- `/api/get-candidates`
- `/api/submit-candidate`
- `/api/[...nextauth]`

---

## Frontend Conventions

### Data Fetching
All data fetching goes through the `useFinanceData` hook (`lib/hooks/useFinanceData.js`). This hook:
- Fetches from all three API routes on mount
- Memoizes computed analytics (weekly totals, monthly trends, etc.)
- Exposes `loadFinanceData()` for manual refresh after mutations

Do not fetch directly from Airtable in components. Always go through API routes.

### Styling
- Dark mode is the default (set in root layout)
- Use CSS variables defined in `globals.css` for colors: `--graphite-*`, `--graphite-text`, etc.
- Accent color: `#5ec7b7` (teal)
- Shared card styles: `.glass-tile` and `.glass-tile-dark`
- Background gradient: `.graphite-bg`

### Read-Only Pages
Dashboard pages are read-only in preview mode. `AddEarningForm` and `AddTransferForm` are disabled when the access gate is in `preview` mode. Check `isPreview` from `FinanceAccessGate` before enabling write actions.

---

## Key Conventions

1. **JavaScript, not TypeScript** — source files use `.js`/`.jsx`. TypeScript is only in config files (`tsconfig.json`).
2. **Client Components** — most components use `"use client"` directive (forms, charts, hooks).
3. **No test files** — the project has no testing infrastructure. Do not add test frameworks without explicit instruction.
4. **Import alias** — use `@/` to import from project root (e.g., `@/lib/airtable/client`).
5. **No ORM** — Airtable is accessed via the `airtable` npm SDK directly. No SQL or ORM layer.
6. **Airtable field resolution** — always resolve fields using schema candidates, never hardcode field names in routes.
7. **No CI/CD** — there are no GitHub Actions workflows. Deploy manually via Vercel.

---

## Common Tasks

### Add a new Airtable field
1. Add the field name(s) to `lib/airtable/schema.js` under the correct table and `finance_v1` schema.
2. Update the mapping in `lib/services/AirtableService.js` to extract the new field.
3. Update the relevant API route to expose it in the response.

### Add a new dashboard page
1. Create `app/dashboard/<name>/page.js` with `"use client"`.
2. Wrap in `<FinanceAccessGate>` to enforce authentication.
3. Use `useFinanceData()` to access data.
4. Add nav link to `components/DashboardNav.js`.

### Add a new API route
1. Create `app/api/<name>/route.js`.
2. Import `getAirtableClient` from `@/lib/airtable/client`.
3. Use `AirtableService` for data mapping.
4. Return errors as `{ error, code }` with appropriate HTTP status.
