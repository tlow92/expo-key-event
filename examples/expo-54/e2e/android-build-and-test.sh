#!/bin/bash

set -e  # Exit on any error

REPORT_DIR="e2e/reports"
mkdir -p "$REPORT_DIR"

echo "==> [Android] Step 1: Running expo prebuild..."
expo prebuild --clean

echo ""
echo "==> [Android] Step 2: Building Android APK..."
cd android && ./gradlew assembleDebug && cd ..

echo ""
echo "==> [Android] Step 3: Installing APK on running emulator/device..."
APK_PATH="android/app/build/outputs/apk/debug/app-debug.apk"

if [ ! -f "$APK_PATH" ]; then
    echo "Error: APK file not found at $APK_PATH"
    exit 1
fi

adb install -r "$APK_PATH"

echo ""
echo "==> [Android] Step 4: Starting Metro bundler and running e2e tests..."
echo "==> [Android] Test report will be saved to: $REPORT_DIR/android-results.xml"

# Run concurrently with output redirected
concurrently --raw --kill-others \
  "npm run e2e:server > /dev/null 2>&1" \
  "npm run start > /dev/null 2>&1" \
  "sleep 10 && maestro test e2e/maestro.e2e.yaml --format junit --output $REPORT_DIR/android-results.xml"

echo ""
echo "==> [Android] Tests completed! Report: $REPORT_DIR/android-results.xml"
