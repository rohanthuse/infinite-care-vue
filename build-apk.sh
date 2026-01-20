#!/bin/bash

# Infinite Care Carer - APK Build Script
# This script automates the entire APK build process

set -e  # Exit on error

echo "================================================"
echo "  Infinite Care Carer - APK Build Script"
echo "================================================"
echo ""

# Colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if we're in the right directory
if [ ! -f "capacitor.config.ts" ]; then
    echo -e "${RED}Error: Please run this script from the project root directory${NC}"
    exit 1
fi

# Step 1: Install dependencies
echo -e "${YELLOW}Step 1/5: Installing Node dependencies...${NC}"
if [ ! -d "node_modules" ]; then
    npm install
else
    echo "✓ Dependencies already installed"
fi
echo ""

# Step 2: Build web app
echo -e "${YELLOW}Step 2/5: Building React web app...${NC}"
npm run build
echo -e "${GREEN}✓ Web app built successfully${NC}"
echo ""

# Step 3: Sync to Android
echo -e "${YELLOW}Step 3/5: Syncing to Android platform...${NC}"
npx cap sync android
echo -e "${GREEN}✓ Synced to Android${NC}"
echo ""

# Step 4: Build APK
echo -e "${YELLOW}Step 4/5: Building Android APK...${NC}"
cd android

# Make gradlew executable
chmod +x gradlew

# Build debug APK
./gradlew assembleDebug --no-daemon

cd ..

echo -e "${GREEN}✓ APK built successfully!${NC}"
echo ""

# Step 5: Show results
echo -e "${YELLOW}Step 5/5: Locating APK...${NC}"
APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"

if [ -f "$APK_PATH" ]; then
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo -e "${GREEN}================================================${NC}"
    echo -e "${GREEN}  ✓ BUILD SUCCESSFUL!${NC}"
    echo -e "${GREEN}================================================${NC}"
    echo ""
    echo -e "APK Location: ${GREEN}$APK_PATH${NC}"
    echo -e "APK Size: ${GREEN}$APK_SIZE${NC}"
    echo ""
    echo "To install on a connected device:"
    echo "  adb install $APK_PATH"
    echo ""
    echo "Or copy the APK to your phone and install manually."
    echo ""
else
    echo -e "${RED}Error: APK not found at expected location${NC}"
    exit 1
fi

echo -e "${GREEN}Done!${NC}"
