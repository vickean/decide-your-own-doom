# OpenCode Portable Setup

This folder contains reusable OpenCode configuration and documentation that can be copied to new projects.

## Contents

| File | Description |
|------|-------------|
| `opencode.json` | OpenCode agent configuration with git safety rules and visual-helper setup |
| `INSTRUCTIONS.md` | Agent behavioral guidelines (git workflow, safety constraints) |
| `TIPS.md` | Debug tips for React/frontend development |
| `setup-git-safety.sh` | Script to configure git aliases for safe git operations |
| `copy-to-root.sh` | Script to copy config files to project root |
| `capture.ts` | Playwright script to capture screenshots for visual-helper |

## Quick Setup for New Projects

### Option 1: Copy the folder + run copy script
```bash
# Copy to new project
cp -r /path/to/.opencode /your/new/project/

# Run the copy script (copies config files to root, skips scripts/README)
cd /your/new/project
./.opencode/copy-to-root.sh

# Run the git safety setup script
./setup-git-safety.sh
```

### Option 2: Git clone into subdirectory
```bash
# Clone into .opencode directory
git clone https://github.com/yourusername/opencode-config.git /your/new/project/.opencode

# Copy config files to root
cd /your/new/project
./.opencode/copy-to-root.sh

# Run git safety setup
./setup-git-safety.sh
```

### Option 3: Symlink (if using dotfiles repo)
```bash
# If you have a dotfiles repo
ln -s ~/dotfiles/opencode/.opencode /your/new/project/.opencode
cd /your/new/project
./.opencode/copy-to-root.sh
```

## Git Safety Aliases

The `setup-git-safety.sh` script configures these aliases:

| Alias | Command | Purpose |
|-------|---------|---------|
| `git sync` | `pull --rebase --autostash` | Safe pull with rebase |
| `git push-safe` | `push --force-with-lease` | Safe force push |
| `git amend` | `commit --amend --no-edit` | Quick commit fix |
| `git nuke-check` | `clean -nd` | Preview cleanup |
| `git save` | `commit -am` | Quick save |

## Screenshot Workflow for Visual-Helper

Use the `capture.ts` script to take screenshots, then feed them to visual-helper:

```bash
# Start dev server
npm run dev

# Capture a screenshot (saves to /tmp/battle.png)
npx tsx .opencode/capture.ts battle
```

Then call visual-helper with the screenshot path:

```typescript
task({
  description: "Analyze battle UI",
  prompt: "Look at /tmp/battle.png and identify any padding/margin issues.",
  subagent_type: "visual-helper"
})
```

## Making Updates

When you update any file in this folder:
1. Test the changes in a project
2. Push the `.opencode` folder to your dotfiles/config repo
3. Pull into other projects when ready

## Repo Setup

To make this portable, initialize a git repo inside `.opencode/`:
```bash
cd .opencode
git init
git add .
git commit -m "Initial opencode config"
# Add remote and push to your dotfiles repo
```
