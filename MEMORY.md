# MEMORY.md

Use this file to preserve important decisions across Codex sessions.

## Initial Setup, Codex instruction structure
**What was decided:** Use a global `AGENTS.md` for Alexander's general working style, change rules, memory rules, and coding behavior. Use project-specific `AGENTS.md` files for BlueLineOps, FreelancerOS, and ChatterBot.
**Why:** Codex reads global and project-level `AGENTS.md` files, so this keeps general rules consistent while letting each project carry its own goals and tech stack.
**What was rejected:** A single overloaded instruction file for every project, because project-specific context would become messy and easier for Codex to misapply.
