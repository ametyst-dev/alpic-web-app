---
description: Start a new macro step cycle in this repo — polls Slack for incoming messages, identifies the next macro step to execute, expands it into a detailed operational guide for Cursor, and confirms with HIL before starting. Use at the beginning of each macro step cycle.
argument-hint: ""
allowed-tools: Read, Write, Glob, Grep, Bash(git checkout *), Bash(git pull *), Bash(git branch *), mcp__slack__slack_get_channel_history, mcp__slack__slack_post_message, EnterPlanMode, ExitPlanMode
---

## step-plan

You are a repo agent running in a product repo branch. Your job is to plan the next macro step for execution.

---

## SLACK MESSAGE GUARDRAIL — READ THIS FIRST

Before doing anything else, read `brainstormings/sprint-*/slack-protocol.md`.

**Every Slack message you send MUST follow the format defined in that file exactly — character by character. No paraphrasing. No shortcuts. No variations. If the format says:**

```
[TYPE] sprint-XXXX
from: {sender}
to: {recipient}
---
{payload}
```

**Then that is exactly what you post. Any deviation from the format breaks the system. This is a hard constraint, not a suggestion.**

When polling Slack, parse incoming messages using the same format. Filter by `to: {agent_name}` or `to: all`.

---

### Step 1 — Load state

**Ensure you are on the sprint branch.** Extract the sprint branch name from the folder structure (e.g. `brainstormings/sprint-0005-my-feature` → branch `my-feature`). Run:
```bash
git checkout {SPRINT_BRANCH}
git pull origin {SPRINT_BRANCH}
```
This ensures you have the latest code including merges from previous step PRs. If you are already on the sprint branch and it's up to date, this is a no-op.

Glob for `brainstormings/sprint-*/sprint-guidelines.md`. If multiple results are returned, use the folder that contains a `sprint-memory.md` with recent activity — or ask HIL to confirm if still ambiguous. Save the resolved sprint folder path (e.g. `brainstormings/sprint-0005-my-feature`) as `{SPRINT_FOLDER}` — use this in all subsequent file paths, never the glob pattern.

Read:
- `{SPRINT_FOLDER}/sprint-guidelines.md` → extract `channel`, `agent_name`, `sprint_goal`, and the full macro steps list. Extract SPRINT_ID from the `channel` field (e.g. channel `sprint-0005-my-feature` → SPRINT_ID `0005`). Extract `{SPRINT_BRANCH}` from the channel by removing the `sprint-{SPRINT_ID}-` prefix (e.g. `sprint-0005-my-feature` → `my-feature`).
- `{SPRINT_FOLDER}/sprint-memory.md` → understand what has already been sent and received. If this file does not exist, create it now.
- `{SPRINT_FOLDER}/slack-protocol.md` → load the message format (see guardrail above)

---

### Step 2 — Poll Slack

Read the last **20** messages from `channel` using `mcp__slack__slack_get_channel_history`.

Filter for messages addressed `to: {agent_name}` or `to: all` that are not already in the Received log of `{SPRINT_FOLDER}/sprint-memory.md`.

For each new message: append to the Received section of `{SPRINT_FOLDER}/sprint-memory.md`.

Note any `UPGRADE_REDIRECT` messages not yet handled — these must be addressed before the next macro step.

---

### Step 3 — Enter plan mode and decide the next step

**Enter plan mode now** by calling `EnterPlanMode`.

From the Sent log in `{SPRINT_FOLDER}/sprint-memory.md`, identify which macro steps have already been marked as STEP_DONE.

Find the first macro step in `{SPRINT_FOLDER}/sprint-guidelines.md` that has NOT yet appeared as STEP_DONE in the Sent log.

If there are pending `UPGRADE_REDIRECT` items → treat them as the current step and plan those first.

If all steps are done → call `ExitPlanMode`, tell HIL: "All macro steps complete for this repo. Nothing left to plan." and end the skill.

---

### Step 3b — Codebase analysis (still in plan mode)

Before proposing the plan to HIL, use plan mode to deeply understand the current state of the code.

---

### Step 3c — Implementation readiness self-check (still in plan mode)

Before presenting the plan to HIL, verify internally: ADR compliance, file existence, test feasibility, chunk dependency chain.

---

### Step 4 — HIL gate: brainstorm and approve the plan in chat (still in plan mode)

Present to HIL the macro step identified, key findings, and the full operational guide as a chat draft.

Ask: "Does this plan look correct? Approve to write the file and send the start signal, or give feedback to adjust."

Once HIL approves → call `ExitPlanMode` to unlock file writes, then proceed to Step 4b.

---

### Step 4b — Write the plan to disk

Take the full operational guide that HIL approved and write it verbatim to `{SPRINT_FOLDER}/step/current-plan.md`.

---

### Step 4c — Write chunk queue

Split the plan into self-contained chunks and write to `{SPRINT_FOLDER}/step/queue.md`.

---

### Step 5 — Create sub-branch, send STEP_START, update memory

1. Create sub-branch: `git checkout -b {SPRINT_BRANCH}/step-{N}`
2. Post STEP_START to Slack
3. Update sprint-memory.md
4. Tell HIL: "Step N plan is live. Open current-plan.md and hand it to Cursor."
