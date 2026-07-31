---
name: commit-message-standards
description: Use when generating or reviewing git commit messages in this repository. Applies the repo's conventional-commit format, usually extracts the task ID from the current branch name for task-related work, and allows omitting the task ID for minor unrelated housekeeping changes.
---

# Commit Message Standards

Use this skill whenever a commit message is requested for this repository.

## Format

- Follow Conventional Commits such as `feat:`, `fix:`, `chore:`, or `refactor:`.
- If the commit is related to the current branch task, extract the task ID from the current branch name and place it at the start of the summary, immediately after the colon.
- If the commit is a minor housekeeping change that is not meaningfully related to the current branch task, the task ID may be omitted.
- If there is any doubt, prefer including the task ID.

Use one of these formats:

```text
<type>([scope]): <TASK-ID> - <summary>
<type>([scope]): <summary>
```

## Task ID Extraction

- Read the current git branch name.
- Expect the branch to follow `<type>/<TEAM_ID>-<ISSUE_NUMBER>-<description>`.
- Use the `<TEAM_ID>-<ISSUE_NUMBER>` segment as the task ID.
- Use the task-ID format for commits that advance, fix, or otherwise belong to that branch's task.

## When Task ID Is Optional

- The no-task-ID format is allowed for small unrelated maintenance or housekeeping commits.
- Typical examples include `.gitignore` updates, Biome rule adjustments, editor config cleanup, or similar repo hygiene that is not part of the branch task itself.
- Do not use the no-task-ID format to avoid linking substantive product or feature work to its task.

Examples:

- `feat/DOK2-200-conditionals` becomes `DOK2-200`
- `fix/SUR-3-button-alignment` becomes `SUR-3`
- `feat/OAK-1793-something` becomes `OAK-1793`

## Examples

Valid:

```text
feat(conditional): DOK2-200 - inline conditional
fix: SUR-3 - align primary buttons on mobile viewport
chore: update biome rule for test files
chore: ignore local generated artifacts
```

Invalid:

```text
feat: inline conditional
feat(DOK2-200): add conditional rendering
DOK2-200: feat add conditional rendering
```
