#!/bin/bash

set -e  # Exit on any error

REPORT_DIR="e2e/reports"
mkdir -p "$REPORT_DIR"

echo "==> [iOS] Step 1: Running expo prebuild..."
expo prebuild --clean

echo ""
echo "==> [iOS] Step 2: Building iOS app for simulator..."
xcrun xcodebuild \
  -workspace ios/expokeyeventexampleexpo54.xcworkspace \
  -scheme expokeyeventexampleexpo54 \
  -configuration Debug \
  -sdk iphonesimulator \
  -destination 'generic/platform=iOS Simulator' \
  -derivedDataPath build

echo ""
echo "==> [iOS] Step 3: Installing app on booted simulator..."
APP_PATH="build/Build/Products/Debug-iphonesimulator/expokeyeventexampleexpo54.app"

if [ ! -d "$APP_PATH" ]; then
    echo "Error: App file not found at $APP_PATH"
    exit 1
fi

xcrun simctl install booted "$APP_PATH"

echo ""
echo "==> [iOS] Step 4: Starting Metro bundler and running e2e tests..."
echo "==> [iOS] Test report will be saved to: $REPORT_DIR/ios-results.xml"

# Run concurrently with output redirected
concurrently --raw --kill-others \
  "npm run e2e:server > /dev/null 2>&1" \
  "npm run start > /dev/null 2>&1" \
  "sleep 10 && maestro test e2e/maestro.e2e.yaml --format junit --output $REPORT_DIR/ios-results.xml"

echo ""
echo "==> [iOS] Tests completed! Report: $REPORT_DIR/ios-results.xml"
