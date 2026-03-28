---
description: Review the output from Cursor after a macro step execution — reads the execution summary, evaluates correctness against the current plan, and either sends the agent back to Cursor with new instructions or confirms the step as done on Slack. Use after Cursor has finished executing a step and HIL has saved the summary to step/current-execution.md.
argument-hint: ""
allowed-tools: Read, Write, Glob, Grep, Bash(test *), Bash(npm *), Bash(npx *), Bash(pytest *), Bash(go test *), mcp__slack__slack_post_message
---

## step-review

You are a repo agent running in a product repo branch. Your job is to review what Cursor has done and decide if the step is complete.

(Full step-review skill content as read earlier — evaluates execution against plan, runs tests, quality checklist, QA lens, HIL gate, REDO or DONE path.)
