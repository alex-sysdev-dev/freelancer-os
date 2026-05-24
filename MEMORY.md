# MEMORY.md

Use this file to preserve important decisions across Codex sessions.

## Initial Setup, Codex instruction structure
**What was decided:** Use a global `AGENTS.md` for Alexander's general working style, change rules, memory rules, and coding behavior. Use project-specific `AGENTS.md` files for BlueLineOps, FreelancerOS, and ChatterBot.
**Why:** Codex reads global and project-level `AGENTS.md` files, so this keeps general rules consistent while letting each project carry its own goals and tech stack.
**What was rejected:** A single overloaded instruction file for every project, because project-specific context would become messy and easier for Codex to misapply.

## 2026-05-18, Local rebuild baseline
**What was decided:** Treat the re-cloned GitHub repo as the source of truth, rebuild with npm from `package-lock.json`, and validate with lint, Vitest, explicit no-emit typecheck, and Next production build.
**Why:** The repo is a Windows/Vercel-style Next.js 16 App Router project with an npm lockfile, existing Vitest tests, and Airtable-backed API routes. Source inspection found no Supabase client or config.
**What was rejected:** Supabase-first troubleshooting and architecture changes, because this repo currently depends on Airtable for data and Vercel only for deployment/analytics/blob packages.

## 2026-05-22, Supabase finance data migration
**What was decided:** Move the active finance API routes for earnings, accounts, and transfers from Airtable to Supabase-backed REST calls, add `supabase/finance_schema.sql`, and keep the existing dashboard UI and password gate intact for this first migration pass.
**Why:** The Supabase project exists but tables are not created yet, and the fastest practical recovery is to create the database foundation and switch the app's existing data contract without rebuilding auth and UI flows at the same time.
**What was rejected:** Adding `@supabase/supabase-js` in this pass, because `npm.cmd install @supabase/supabase-js` timed out or exited without useful output. Direct Supabase REST calls through server API routes avoid dependency churn and keep the migration moving.

## 2026-05-23, Supabase JS client added
**What was decided:** Keep the existing Supabase REST request helper for current API routes, but add an official `@supabase/supabase-js` server client export in `lib/supabase/client.js` for the next migration steps.
**Why:** `@supabase/supabase-js` is now installed and passes baseline checks, so future Supabase work can use the supported client without breaking the routes already wired to `supabaseRequest`.
**What was rejected:** Replacing the existing route data flow in this step, because the goal was to add the client safely without changing dashboard behavior yet.

## 2026-05-23, Supabase API verification passed
**What was decided:** Keep the app using Supabase-backed API routes after validating create/read behavior for accounts, earnings, and transfers through localhost.
**Why:** The schema was applied successfully, `.env.local` includes a server-only Supabase key, and API verification created and read an account, earning, and transfer without errors.
**What was rejected:** Moving back to Airtable or adding Supabase Auth in this step, because the current password-gated app works with server-side Supabase access and the priority is a stable backend migration first.

## 2026-05-23, Supabase six-month earnings data
**What was decided:** Add Supabase earnings with weekly rows from 2025-11-24 through 2026-05-18 for Mercor, Handshake, Outlier, and Alignerr under project `Weekly Platform Income`.
**Why:** Alexander wanted six months of weekly income data with deposits spread across the platforms and most income coming from Mercor. The data load inserted 104 earnings rows and direct Supabase verification returned totals of Mercor 27660, Handshake 14920, Outlier 12480, and Alignerr 11660.
**What was rejected:** Adding account-transfer deposits for this request, because the named platforms map to earnings sources and the dashboard's income charts read from the earnings table.

## 2026-05-23, Supabase transfer account spread
**What was decided:** Add Navy Federal and Bluevine accounts alongside Checking, then load 26 weeks of income allocation transfers across all three accounts.
**Why:** Alexander wanted transfers to include two more accounts so the transfers and account balance views show a more realistic account spread. Direct Supabase verification returned 78 transfers with totals of Checking 7525, Navy Federal 6100, and Bluevine 10625.
**What was rejected:** Leaving all transfer activity under one Checking account, because that made the dashboard data look too narrow for the intended finance view.

## 2026-05-23, Cash Runway feature
**What was decided:** Add Cash Runway with tax reserve, safe-to-spend cash, runway months, and buffer gap calculations, plus editable monthly expense target, tax reserve rate, and minimum cash buffer controls.
**Why:** This gives the finance dashboard an operator decision layer that answers whether cash is safe to spend after tax reserve and monthly burn assumptions. The implementation adds `/api/settings`, `finance_settings` schema SQL, overview cards, and the full Forecast page control surface.
**What was rejected:** Hardcoding the settings only in UI, because customers need to change their own reserve and runway assumptions. A local browser fallback remains available until the Supabase `finance_settings` table is applied.
