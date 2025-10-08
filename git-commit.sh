#!/bin/bash

# Smart Git Commit Script with Auto-Version Update
# Usage: ./git-commit.sh "Your commit message"

if [ -z "$1" ]; then
    echo "❌ Error: Commit message required"
    echo "Usage: ./git-commit.sh \"Your commit message\""
    exit 1
fi

echo "🔄 Updating version..."
npm run version

if [ $? -ne 0 ]; then
    echo "⚠️  Warning: Version update failed, continuing anyway..."
fi

echo ""
echo "📝 Staging changes..."
git add .

echo ""
echo "💾 Creating commit..."
git commit -m "$1

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>"

if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Commit created successfully!"
    echo ""
    read -p "Push to GitHub? (y/n) " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        echo "🚀 Pushing to GitHub..."
        git push
        echo "✅ Push complete!"
    else
        echo "⏭️  Skipped push. Run 'git push' manually when ready."
    fi
else
    echo "❌ Commit failed!"
    exit 1
fi
