---
description: Ship the current macro step — runs final test suite, pushes the sub-branch, opens a PR to the sprint branch, checks if documentation needs updating, and notifies Slack. Use after step-review confirms DONE.
argument-hint: ""
allowed-tools: Read, Write, Glob, Grep, Bash(git status *), Bash(git log *), Bash(git branch *), Bash(git diff *), Bash(gh pr view *), Bash(gh pr diff *), mcp__slack__slack_post_message
---

## step-ship

Ship the completed macro step: run tests, push, open a PR to the sprint branch, and notify Slack.

(Full step-ship skill content as read earlier — pre-flight checks, push sub-branch, open PR, documentation check, notify Slack.)
