#!/bin/bash

# Quick Build Script for Personal Use
# Run this to build the Android APK

echo "🚀 Building Video Call App APK for Personal Use"
echo "================================================"

# Step 1: Check if we're in the right directory
if [ ! -d "mobile" ]; then
    echo "❌ Error: Please run this script from /app directory"
    exit 1
fi

# Step 2: Navigate to mobile folder
cd mobile

echo "📦 Step 1: Installing dependencies..."
yarn install

# Step 3: Navigate to android folder
cd android

echo "🔨 Step 2: Building APK (this may take 5-10 minutes)..."
./gradlew assembleRelease

# Step 4: Check if build succeeded
if [ -f "app/build/outputs/apk/release/app-release.apk" ]; then
    echo "✅ Success! APK built successfully!"
    echo ""
    echo "📱 Your APK is located at:"
    echo "   $(pwd)/app/build/outputs/apk/release/app-release.apk"
    echo ""
    echo "📋 Next steps:"
    echo "   1. Copy the APK to your phone"
    echo "   2. Enable 'Install from Unknown Sources' on your phone"
    echo "   3. Install the APK"
    echo "   4. Share the APK with your friend"
    echo ""
    echo "🎉 You're ready to use the app!"
else
    echo "❌ Build failed. Check the error messages above."
    exit 1
fi

cd ../..
