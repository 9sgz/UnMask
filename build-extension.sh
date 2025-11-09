#!/bin/bash

echo "🛡️  Building UnMask Chrome Extension..."

# Build using extension config
echo "📦 Building with Vite..."
npx vite build --config vite.config.extension.ts

# Copy manifest to dist
echo "📋 Copying manifest..."
cp public/manifest.json dist/

# Copy icons to dist if they exist
if [ -d "public" ]; then
  echo "🎨 Copying assets..."
  cp -r public/favicon.ico dist/ 2>/dev/null || true
fi

echo "✅ Build complete! Extension files are in the 'dist/' folder"
echo ""
echo "To install:"
echo "1. Open Chrome and go to chrome://extensions/"
echo "2. Enable 'Developer mode'"
echo "3. Click 'Load unpacked'"
echo "4. Select the 'dist/' folder"
echo ""
echo "📚 For detailed instructions, see EXTENSION_INSTALL.md"
