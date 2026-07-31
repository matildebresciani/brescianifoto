---
name: pnpm-scripts
description: Use when running shared pnpm scripts in this repository, especially `test`, `lint`, `lint:fix`, `format:check`, or `format:fix` from the repo root or from a package or app directory. Also use when deciding whether to run one of these scripts from the root versus inside a package, or when targeting a specific app or package from the repo root.
---

# PNPM Scripts

Use this skill for routine script execution in this monorepo. Keep package-specific instructions from local `AGENTS.md` files in force alongside this skill.

## Shared script surface

- The repo root and most packages expose these scripts: `test`, `lint`, `lint:fix`, `format:check`, and `format:fix`.
- Prefer `pnpm <script>` from the current package or app when you are already inside the target directory.
- From the repo root, prefer filtered runs when you are targeting a specific app or package.
- Use unfiltered root-level `pnpm <script>` wrappers only for intentional workspace-wide runs.

## Root-level targeted runs

- When running a shared script for a specific app or package from the repo root, prefer `pnpm run '--filter=<target>' <script> <other args>`.
- For `apps/app`, use `pnpm run '--filter=app' <script> <other args>` from the repo root.
- If the current working directory is already inside the target app or package, do not add a filter.

## Command selection

- Before assuming every package supports every shared script, check the nearest `package.json` if you are outside the repo root, `apps/app`, or another package you already verified.
- Treat missing scripts as a package-specific exception rather than forcing the shared command shape.
