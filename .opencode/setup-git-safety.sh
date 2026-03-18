#!/bin/bash

# Store original directory
ORIG_DIR="$(pwd)"

# Move up to find git repo root
while [ ! -d .git ] && [ "$(pwd)" != / ]; do
    cd ..
done

# Check if we found a git repo
if [ ! -d .git ]; then
    echo "Error: No git repository found"
    cd "$ORIG_DIR" 2>/dev/null
    exit 1
fi

GIT_ROOT="$(pwd)"
echo "Found git repository at: $GIT_ROOT"
echo "Setting up safety aliases for OpenCode..."

# 1. 'sync' - Pulls with rebase and auto-stashes local changes to prevent merge commits
git config --local alias.sync "pull --rebase --autostash"

# 2. 'push-safe' - Uses force-with-lease to protect remote history
git config --local alias.push-safe "push --force-with-lease"

# 3. 'amend' - Quickly fixes the last commit without opening an editor
git config --local alias.amend "commit --amend --no-edit"

# 4. 'nuke-check' - Shows what 'git clean' would delete without actually doing it
git config --local alias.nuke-check "clean -nd"

# 5. 'save' - A simple wrapper for stage + commit with a message
git config --local alias.save "commit -am"

echo "--------------------------------------------------"
echo "Success! The following aliases are now active for this project:"
git config --get-regexp '^alias\.'

# Return to original directory
cd "$ORIG_DIR"