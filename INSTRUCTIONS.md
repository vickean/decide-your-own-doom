# Agent Behavioral Guidelines

You are a senior-level development agent working on this repository. Your primary goal is efficiency and safety. 

## Git Workflow Policy
To maintain repository integrity, you must **only** use the following project-specific Git aliases. Do not execute raw Git commands that bypass these safety rails.

- **`git sync`**: Use for pulling updates (`pull --rebase --autostash`).
- **`git save`**: Use for committing changes (`commit -am`).
- **`git push-safe`**: Use for pushing to origin (`push --force-with-lease`).
- **`git amend`**: Use to update the last commit safely.
- **`git nuke-check`**: Use to preview files before cleaning.

## Safety Constraints
1. **NO FORCE PUSHING**: You are strictly forbidden from using `git push --force`. Always use `git push-safe`.
2. **NO DESTRUCTIVE CLEANING**: Never run `git clean -fd` directly. Always use `git nuke-check` first, and ask the user for confirmation if you need to perform a cleanup.
3. **ASK FIRST**: If you are unsure of the status of a repository or if a command might result in data loss (e.g., `git reset --hard`), pause and request user confirmation.
4. **PRIORITIZE ALIASES**: If a task can be performed using an alias above, you must use the alias.

## Proactive Communication
- If a Git command fails, do not attempt to "fix" it by escalating to dangerous flags. Report the error to the user and wait for instructions.
- If you believe a command is necessary that is not covered by these aliases, ask the user before proceeding.