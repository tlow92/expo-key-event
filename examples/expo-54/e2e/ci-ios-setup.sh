#!/bin/bash
set -e

# CI-friendly iOS E2E setup script
# This script avoids AppleScript issues by using xcrun simctl directly

echo "🔨 Building iOS app..."

# Set device and OS version (customize as needed)
SIMULATOR_NAME="${SIMULATOR_NAME:-iPhone 16 Pro}"
IOS_VERSION="${IOS_VERSION:-}"  # Leave empty to auto-select any available iOS version

# Build configuration
CONFIGURATION="${CONFIGURATION:-Debug}"
SCHEME="${SCHEME:-expokeyeventexampleexpo54}"

# Build destination string based on whether iOS version is specified
if [ -n "$IOS_VERSION" ]; then
  SIMULATOR_DEVICE="${SIMULATOR_NAME} (${IOS_VERSION})"
  XCODE_DESTINATION="platform=iOS Simulator,name=${SIMULATOR_NAME},OS=${IOS_VERSION}"
  echo "📱 Target simulator: ${SIMULATOR_DEVICE}"
else
  SIMULATOR_DEVICE="${SIMULATOR_NAME}"
  XCODE_DESTINATION="platform=iOS Simulator,name=${SIMULATOR_NAME}"
  echo "📱 Target simulator: ${SIMULATOR_DEVICE} (any available iOS version)"
fi

echo "🔧 Configuration: ${CONFIGURATION}"

# Build the app using xcodebuild directly
echo "🏗️  Running xcodebuild..."
cd ios

xcodebuild \
  -workspace expokeyeventexampleexpo54.xcworkspace \
  -scheme ${SCHEME} \
  -configuration ${CONFIGURATION} \
  -sdk iphonesimulator \
  -derivedDataPath build \
  -destination "${XCODE_DESTINATION}" \
  build

cd ..

# Find the built .app
APP_PATH=$(find ios/build/Build/Products/${CONFIGURATION}-iphonesimulator -name "*.app" -type d -maxdepth 1 | head -n 1)

if [ -z "$APP_PATH" ]; then
  echo "❌ Error: Could not find built .app file"
  exit 1
fi

echo "✅ Built app at: ${APP_PATH}"

# Get or create simulator
echo "🔍 Finding simulator..."

# Search for simulator - either exact match with version or any match by name
if [ -n "$IOS_VERSION" ]; then
  # Match by iOS version section and device name
  # Use awk to find devices under the correct iOS version section
  SIMULATOR_UDID=$(xcrun simctl list devices available | awk -v ios="$IOS_VERSION" -v device="$SIMULATOR_NAME" '
    /^-- iOS/ {
      current_ios = $0
      gsub(/^-- iOS /, "", current_ios)
      gsub(/ --$/, "", current_ios)
    }
    current_ios == ios && $0 ~ device {
      match($0, /[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}/)
      if (RSTART > 0) {
        print substr($0, RSTART, RLENGTH)
        exit
      }
    }
  ')
else
  # Match by name only (any iOS version)
  SIMULATOR_UDID=$(xcrun simctl list devices available | grep "${SIMULATOR_NAME}" | grep -o '[A-F0-9]\{8\}-[A-F0-9]\{4\}-[A-F0-9]\{4\}-[A-F0-9]\{4\}-[A-F0-9]\{12\}' | head -n 1)
fi

if [ -z "$SIMULATOR_UDID" ]; then
  echo "❌ Error: Could not find simulator matching '${SIMULATOR_DEVICE}'"
  echo "Available simulators:"
  xcrun simctl list devices available
  exit 1
fi

echo "📱 Using simulator UDID: ${SIMULATOR_UDID}"

# Check if simulator is already booted
SIMULATOR_STATE=$(xcrun simctl list devices | grep "${SIMULATOR_UDID}" | sed -n 's/.*(\(.*\)).*/\1/p')

if [ "$SIMULATOR_STATE" != "Booted" ]; then
  echo "🚀 Booting simulator..."
  xcrun simctl boot "${SIMULATOR_UDID}"

  # Wait for simulator to boot (max 60 seconds)
  echo "⏳ Waiting for simulator to boot..."
  for i in {1..60}; do
    SIMULATOR_STATE=$(xcrun simctl list devices | grep "${SIMULATOR_UDID}" | sed -n 's/.*(\(.*\)).*/\1/p')
    if [ "$SIMULATOR_STATE" = "Booted" ]; then
      echo "✅ Simulator booted"
      break
    fi
    sleep 1
  done

  if [ "$SIMULATOR_STATE" != "Booted" ]; then
    echo "❌ Error: Simulator failed to boot in time"
    exit 1
  fi
else
  echo "✅ Simulator already booted"
fi

# Install the app
echo "📲 Installing app..."
xcrun simctl install "${SIMULATOR_UDID}" "${APP_PATH}"
echo "✅ App installed"

# Launch the app
echo "🚀 Launching app..."
BUNDLE_ID="expo.modules.keyevent.exampleExpo54"
xcrun simctl launch --console-pty "${SIMULATOR_UDID}" "${BUNDLE_ID}"
echo "✅ App launched"

echo ""
echo "✅ iOS setup complete!"
echo "   UDID: ${SIMULATOR_UDID}"
echo "   App: ${APP_PATH}"
echo "   Bundle ID: ${BUNDLE_ID}"
