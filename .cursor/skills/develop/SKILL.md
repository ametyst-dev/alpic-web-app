---
description: Execute the current step plan — reads the active sprint's chunk queue (or current-plan.md as fallback), implements tasks chunk by chunk, then writes current-execution.md with a precise summary of what was done, any deviations from the plan, and open questions. Use when you are ready to execute a sprint step.
argument-hint: ""
---

## develop

You are a senior developer executing a sprint step. You read an operational guide, implement it completely, then write an honest execution report. You never invent steps, never guess intent, and never skip the report.

---

## GUARDRAILS — READ BEFORE ANYTHING ELSE

- **Do NOT start if `current-sprint.mdc` is missing or unreadable.** Stop immediately with a clear message.
- **Do NOT start if both `queue.md` and `current-plan.md` are missing.** Stop immediately with a clear message.
- **Do NOT invent steps not in the plan.** If something is unclear, flag it in the execution report — do not guess and proceed.
- **Do NOT skip the execution report.** It is required — without it, the review agent cannot validate the step.
- **If you hit a blocker mid-execution**, stop work, note exactly where you stopped, and write a partial report.

---

### Step 1 — Load sprint context

Read `.cursor/rules/current-sprint.mdc`.

If the file does not exist → **stop**:
> "current-sprint.mdc not found. Cannot determine the active sprint folder. Open a Claude Code session in domain-expansion and run sprint-planner to initialize a sprint."

If the file exists but `sprint_folder` is missing or empty → **stop**:
> "sprint_folder is not set in .cursor/rules/current-sprint.mdc. The file may be corrupt or from a previous sprint. Ask your Claude Code agent to re-run sprint-planner."

Extract `sprint_folder` value. Save it as `{SPRINT_FOLDER}` (e.g. `brainstormings/sprint-0005-my-feature`).

---

### Step 2 — Load the queue

Check if `{SPRINT_FOLDER}/step/queue.md` exists.

**If `queue.md` exists** → use chunk-based execution (Steps 3a–3d below).

**If `queue.md` does not exist** → fall back to `{SPRINT_FOLDER}/step/current-plan.md` and execute it as a single chunk (legacy mode). Read it, execute everything in Step 3b, then write the report in Step 4.

If neither file exists → **stop**:
> "No queue.md or current-plan.md found at {SPRINT_FOLDER}/step/. Run the step-plan skill in Claude Code first, then come back here."

---

### Step 3a — Find next chunk

Read `{SPRINT_FOLDER}/step/queue.md`. Scan for the first chunk with `**Status:** pending`.

If no pending chunks remain → all chunks are done. Go to Step 4.

---

### Step 3b — Execute chunk

1. Mark the chunk as `**Status:** in_progress` in `queue.md` (edit the file in place).
2. Read **only** the instructions for this chunk. Do not look at other chunks — focus exclusively on this one.
3. Execute autonomously — do not ask for confirmation, do not pause. The chunk is your contract.
4. Act as a senior developer:
   - Write, edit, or delete files exactly as specified in the chunk
   - Respect existing code patterns and conventions in the repo
   - Do not add unrequested features, refactor out of scope, or clean up unrelated code
   - Do not skip steps even if they seem trivial
5. **If this is a test chunk** (marked with `**Type:** test`):
   - Write the test files as specified in the chunk instructions
   - Run the test command from `**Test command:**` at the top of `queue.md`
   - If tests **pass** → proceed to Step 3b-commit
   - If tests **fail** → attempt to fix the test or implementation (max 2 attempts). If still failing, report the failure in Step 3c with status `blocked` and include the test output.

The only valid reason to stop mid-chunk is a **hard blocker** — something that makes it physically impossible to continue. In that case, note exactly where you stopped and proceed to Step 3c with status `blocked`.

Everything else — ambiguity in naming, minor implementation choices, deciding between two equivalent approaches — make the call yourself and note it under "Deviations".

---

### Step 3b-commit — Commit at commit point

This step runs only for chunks with `**Commit point:**`. After the test chunk passes:

1. Stage all files changed since the last commit point (the files listed in this chunk AND all preceding chunks included in the commit point range).
2. Create a commit with message:
   ```
   [sprint-{SPRINT_ID}] step {N} chunks {X}-{Y}: {one-line description of what these chunks accomplish}
   ```
   Where `{SPRINT_ID}` is extracted from the sprint folder name, `{N}` is the macro step number, and `{X}-{Y}` is the commit point range from the chunk header.
3. Do NOT push — only commit locally. Pushing happens later in the ship phase.

If the commit fails for any reason, note it in the chunk report and proceed — do not block on commit failures.

---

### Step 3c — Report chunk

Append the chunk result to `{SPRINT_FOLDER}/step/current-execution.md`. **Always append, never overwrite** — each chunk adds its section.

If the file does not exist yet (first chunk), create it with:

```markdown
# Execution Report

**Date:** {TODAY_DATE}
**Plan:** {SPRINT_FOLDER}/step/current-plan.md
**Queue:** {SPRINT_FOLDER}/step/queue.md
```

Then append:

```markdown
---

## Chunk N — [title]
**Status:** complete | partial | blocked
**Committed:** yes (commit hash) | no | n/a (not a commit point)

### What was done
{Describe what was implemented, file by file. Be specific — this will be reviewed by a Claude Code agent.}

### Test results
{If this is a test chunk: which tests were written, test command output (pass/fail count), any tests that required fixes. If not a test chunk: "N/A — not a test chunk."}

### Deviations from chunk plan
{List every point where you did something different from what was specified, and explain why. If none: "None."}

### Doubts and open questions
{Anything unclear, any decision you made without certainty. If none: "None."}

### Blockers
{If status is partial or blocked: what stopped you, where you stopped, what is needed to unblock. If none: "None."}
```

After appending, mark the chunk as `**Status:** done` in `queue.md`.

---

### Step 3d — Loop or stop

- If chunk was **complete** → go back to **Step 3a** (find next pending chunk).
- If chunk was **partial** or **blocked** → stop the loop, go to **Step 4**.

---

### Step 4 — Finalize report

Add a summary header at the top of `{SPRINT_FOLDER}/step/current-execution.md` (insert after the existing header, before the first chunk):

```markdown
---

## Summary
**Overall status:** complete | partial | blocked
**Chunks completed:** X / Y
**Chunks blocked:** [list chunk numbers, or "None"]
```

---

### Step 5 — Confirm

If execution was **complete** (all chunks done):
> "Execution complete. Report written to {SPRINT_FOLDER}/step/current-execution.md. Switch to Claude Code and run step-review to validate and send the Slack signal."

If execution was **partial or blocked**:
> "Execution stopped at Chunk N. Partial report written to {SPRINT_FOLDER}/step/current-execution.md. Review the Blockers section, resolve the issue, then run step-review in Claude Code."
