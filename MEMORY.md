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
