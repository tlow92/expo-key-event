#!/bin/bash

set -e  # Exit on any error

REPORT_DIR="e2e/reports"
mkdir -p "$REPORT_DIR"

# Check if Maestro is installed
if ! command -v maestro &> /dev/null; then
    echo "==> [Android] Maestro not found. Installing Maestro..."
    curl -fsSL "https://get.maestro.mobile.dev" | bash
    export PATH="$PATH:$HOME/.maestro/bin"
fi

# Check if any Android devices/emulators are available
echo "==> [Android] Checking for devices..."
DEVICES=$(adb devices | grep -v "List of devices" | grep "device$" | wc -l)

if [ "$DEVICES" -eq 0 ]; then
    echo "==> [Android] No devices found. Starting Android emulator..."
    maestro start-device --platform android --os-version 33

    # Wait a moment for device to be recognized by adb
    sleep 15

    # Verify device is now available
    DEVICES=$(adb devices | grep -v "List of devices" | grep "device$" | wc -l)
    if [ "$DEVICES" -eq 0 ]; then
        echo "==> [Android] Failed to start device. Skipping Android tests."
        exit 2  # Exit code 2 = skipped
    fi
    echo "==> [Android] Device started successfully"
else
    echo "==> [Android] Found $DEVICES device(s)"
fi
echo ""

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

TEST_EXIT_CODE=$?

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "==> [Android] Tests completed successfully! Report: $REPORT_DIR/android-results.xml"
    exit 0
else
    echo "==> [Android] Tests failed! Report: $REPORT_DIR/android-results.xml"
    exit 1
fi
