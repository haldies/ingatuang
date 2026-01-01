#!/bin/bash

# Build Optimized APK Script
# This script builds the smallest possible APK for production

echo "🚀 Building Optimized APK for IngatUang"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Clean previous builds
echo -e "${BLUE}Step 1: Cleaning previous builds...${NC}"
cd android
./gradlew clean
cd ..
echo -e "${GREEN}✓ Clean complete${NC}"
echo ""

# Step 2: Clear Metro cache
echo -e "${BLUE}Step 2: Clearing Metro cache...${NC}"
npx expo start -c &
sleep 3
kill %1
echo -e "${GREEN}✓ Cache cleared${NC}"
echo ""

# Step 3: Build release APK (arm64-v8a only)
echo -e "${BLUE}Step 3: Building release APK (arm64-v8a only)...${NC}"
echo -e "${YELLOW}This may take 5-10 minutes...${NC}"
cd android
./gradlew assembleRelease -PreactNativeArchitectures=arm64-v8a
cd ..
echo -e "${GREEN}✓ Build complete${NC}"
echo ""

# Step 4: Show APK info
echo -e "${BLUE}Step 4: APK Information${NC}"
APK_PATH="android/app/build/outputs/apk/release/app-release.apk"

if [ -f "$APK_PATH" ]; then
    echo -e "${GREEN}✓ APK created successfully!${NC}"
    echo ""
    echo "📦 APK Location:"
    echo "   $APK_PATH"
    echo ""
    echo "📊 APK Size:"
    ls -lh "$APK_PATH" | awk '{print "   " $5}'
    echo ""
    echo "🎯 Target Architecture: arm64-v8a (64-bit ARM)"
    echo "📱 Compatible with: Most modern Android devices (2019+)"
    echo ""
    echo -e "${YELLOW}Next steps:${NC}"
    echo "1. Test on real device: adb install $APK_PATH"
    echo "2. Or copy to device and install manually"
    echo ""
else
    echo -e "${YELLOW}⚠ APK not found. Build may have failed.${NC}"
    echo "Check the error messages above."
fi
