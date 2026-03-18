#!/bin/bash

# Script to copy .opencode/ contents to project root
# Run this when setting up a new project

OPENCODE_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "Copying OpenCode config files to project root..."

# Copy files (excluding this script and README)
for file in "$OPENCODE_DIR"/*; do
  filename=$(basename "$file")
  
  # Skip this script and README
  if [[ "$filename" == "setup-git-safety.sh" ]] || [[ "$filename" == "README.md" ]]; then
    echo "  Skipping: $filename"
    continue
  fi
  
  echo "  Copying: $filename"
  cp "$file" "./$filename"
done

echo ""
echo "Done! Files copied to project root."
echo ""
echo "Next steps:"
echo "  1. Run: ./setup-git-safety.sh  (to configure git aliases)"
echo "  2. Review the copied files as needed"
