#!/bin/bash

set -e  # Exit on any error

echo "🧹 Cleaning previous builds..."
rm -rf npx-cli/dist
mkdir -p npx-cli/dist/macos-arm64

echo "🔨 Building frontend..."
(cd frontend && npm run build)

echo "🔨 Building Rust binaries..."
cargo build --release --manifest-path Cargo.toml
cargo build --release --bin mcp_task_server --manifest-path Cargo.toml

echo "📦 Creating distribution package..."

# Copy the main binary
cp target/release/server task-copilot
zip -q task-copilot.zip task-copilot
rm -f task-copilot 
mv task-copilot.zip npx-cli/dist/macos-arm64/task-copilot.zip

# Copy the MCP binary
cp target/release/mcp_task_server task-copilot-mcp
zip -q task-copilot-mcp.zip task-copilot-mcp
rm -f task-copilot-mcp
mv task-copilot-mcp.zip npx-cli/dist/macos-arm64/task-copilot-mcp.zip

# Copy the Review CLI binary
cp target/release/review task-copilot-review
zip -q task-copilot-review.zip task-copilot-review
rm -f task-copilot-review
mv task-copilot-review.zip npx-cli/dist/macos-arm64/task-copilot-review.zip

echo "✅ Build complete!"
echo "📁 Files created:"
echo "   - npx-cli/dist/macos-arm64/task-copilot.zip"
echo "   - npx-cli/dist/macos-arm64/task-copilot-mcp.zip"
echo "   - npx-cli/dist/macos-arm64/task-copilot-review.zip"
echo ""
echo "🚀 To test locally, run:"
echo "   cd npx-cli && node bin/cli.js"
