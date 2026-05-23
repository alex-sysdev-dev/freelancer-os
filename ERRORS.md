# ERRORS.md

Use this file to record approaches that took more than 2 attempts to work.

## Template
**What did not work:** [approaches that failed and why]
**What worked:** [the approach that finally succeeded]
**Note for next time:** [anything worth remembering for similar tasks]

## Fresh npm install after partial timeout
**What did not work:** The first `npm ci` timed out during a cold Windows install and left a partial `node_modules`. A second `npm ci` failed with `ENOTEMPTY` while removing `node_modules\next\dist\bin`.
**What worked:** Remove only the generated `D:\Projects\FreelancerOs\node_modules` folder after verifying the path, then rerun `npm ci`.
**Note for next time:** If `npm ci` times out on this repo and the next run reports `ENOTEMPTY` inside `node_modules`, clean the generated dependency folder before retrying.

## Supabase dependency install and local Node validation
**What did not work:** `npm.cmd install @supabase/supabase-js` timed out once, then the escalated retry exited with no useful output. After the code migration, `npm.cmd run test`, direct Vitest, `node --check`, and `node -p "1+1"` also timed out instead of returning results.
**What worked:** Avoided the new package dependency and used server-side Supabase REST calls through built-in `fetch`, so package files did not need dependency churn.
**Note for next time:** Before trusting local validation on this checkout, first verify why `D:\apps\node\node.exe` can print `--version` but hangs on script execution.
