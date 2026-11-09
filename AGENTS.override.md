# Operator Additions

## Strict session roles (VM Codex + GPU Qoder)

Cursor Grok is coordinator only. It must not implement product code.

| Role | Machine | Tool | Model / effort |
|---|---|---|---|
| Coordinator | Cursor VM | Grok | routing, rsync, GitHub |
| Planner | Cursor VM | Codex CLI | `gpt-6-astra` + `xhigh` (extra high) |
| Orchestrator / director | Cursor VM | Codex CLI | `gpt-6.1-sol` + `max` |
| Reviewer | Cursor VM | Codex CLI | `gpt-6.1-sol` + `max` |
| Coding swarm | GPU `gpu-fqaf` | Qoder CLI | `Efficient` Agent Teams / subagents |

Flow: sync repo to the GPU → Qoder Efficient swarm codes there → bundle/download to the VM → Sol max reviews quality, completeness, bugs, optimizations → coordinator does GitHub. Failed review goes back to Qoder as a fix batch.

Local operator scripts: `~/.coordinator/run-batch.sh`.

## Contributor Courtesy Merge Cleanup

When a contributor has substantially completed significant changes requested in review and only low-impact merge work remains, maintainers may finish that cleanup and merge the pull request as a courtesy.

This permission is limited to mechanical, low-risk work such as resolving a small conflict with an already-merged change, preserving an established default, or adding narrowly scoped regression coverage for the reviewed behavior. Re-run the applicable review, test, and exact-head merge gates before merging, and tell the contributor what was changed.

If the merge or rebase has a large surface area, changes behavior beyond the reviewed intent, requires product or architectural judgment, or exposes additional substantive defects, do not take over the branch. Ask the contributor to rebase and correct the issues, then re-review their updated head.
