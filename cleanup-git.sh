#!/bin/bash

echo "Removing frontend/node_modules from git tracking..."
git rm -r --cached frontend/node_modules/

echo "Removing any remaining log files..."
git ls-files | grep -E "\.log$" | xargs -r git rm --cached

echo "Removing cache files..."
git ls-files | grep -E "(\.cache|\.eslintcache)" | xargs -r git rm --cached

echo "Removing pack files..."
git ls-files | grep -E "(\.pack$|\.pack\.old$)" | xargs -r git rm --cached

echo "Done! Files have been removed from git tracking but remain on disk."
echo "Run 'git status' to see the changes."