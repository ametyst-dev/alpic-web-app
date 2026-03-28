# Slack Protocol — Agent Communication Bus

All messages in the sprint Slack channel follow this format:

```
[TYPE] sprint-XXXX
from: {sender}
to: {recipient}
---
{payload}
```

`from` and `to` use the `agent_name` defined in each repo's guidelines file.
Valid recipients: any `agent_name`, `domain-expansion`, `all`.

---

## Message Types

### SPRINT_START
Sent by sprint planner at sprint launch.

```
[SPRINT_START] sprint-XXXX
from: sprint-planner
to: all
---
repos: [repo-a, repo-b]
goal: {sprint goal summary}
```

---

### MACRO_STEP_START
Sent by domain expansion when a macro step begins across all involved repos.

```
[MACRO_STEP_START] sprint-XXXX
from: domain-expansion
to: all
---
step: {N}
involved: [repo-a, repo-b]
description: {what this macro step is about}
```

---

### MACRO_STEP_DONE
Sent by domain expansion when all involved repos have completed a macro step.

```
[MACRO_STEP_DONE] sprint-XXXX
from: domain-expansion
to: all
---
step: {N}
```

---

### STEP_START
Sent by a repo agent when it begins executing a macro step.

```
[STEP_START] sprint-XXXX
from: {repo-agent}
to: domain-expansion
---
macro_step: {N}
branch: {sub-branch name, e.g. feature-x/step-1}
description: {what this agent is starting}
```

---

### STEP_DONE
Sent by a repo agent when it completes a macro step (after step-ship pushes and opens PR).

```
[STEP_DONE] sprint-XXXX
from: {repo-agent}
to: domain-expansion
---
macro_step: {N}
summary: {what was done}
pr_link: {URL of the PR to sprint branch} | none
upgrades_proposed: none | {description of upgrade for target repo}
```

---

### PR_MERGED
Sent by domain expansion after merging a step PR into the sprint branch.

```
[PR_MERGED] sprint-XXXX
from: domain-expansion
to: {repo-agent}
---
macro_step: {N}
pr_link: {URL of the merged PR}
```

---

### BLOCKED
Sent by a repo agent when it cannot proceed without external input.

```
[BLOCKED] sprint-XXXX
from: {repo-agent}
to: domain-expansion
---
macro_step: {N}
reason: {why blocked}
waiting_for: {repo name or prerequisite}
```

---

### UPGRADE_PROPOSED
Sent by a repo agent to propose a change to another repo.

```
[UPGRADE_PROPOSED] sprint-XXXX
from: {repo-agent}
to: domain-expansion
---
target_repo: {repo-name}
description: {what to do}
reason: {why it is necessary}
```

---

### UPGRADE_ACCEPTED
Sent by domain expansion to the repo that proposed the upgrade, confirming it has been redirected.

```
[UPGRADE_ACCEPTED] sprint-XXXX
from: domain-expansion
to: {proposing-repo}
---
original_proposal: {description}
redirected_to: {target-repo}
priority: before_next_step | after_current_step
```

---

### UPGRADE_REDIRECT
Sent by domain expansion to the repo that must execute the upgrade.

```
[UPGRADE_REDIRECT] sprint-XXXX
from: domain-expansion
to: {target-repo}
---
original_from: {proposing-repo}
description: {what to do}
priority: before_next_step | after_current_step
```

---

### UPGRADE_REJECTED
Sent by domain expansion to the repo that proposed the upgrade.

```
[UPGRADE_REJECTED] sprint-XXXX
from: domain-expansion
to: {proposing-repo}
---
original_proposal: {description}
reason: {why rejected or deferred}
```

---

### SPRINT_CLOSED
Sent by domain expansion when HIL closes the sprint.

```
[SPRINT_CLOSED] sprint-XXXX
from: domain-expansion
to: all
---
Sprint closed. See CLOSING.md for summary.
```
