#!/bin/bash
set -e

# Pre-boot simulator to avoid AppleScript timeout issues
# This script boots the simulator before expo run:ios, which reduces
# the likelihood of osascript timeouts in CI environments

echo "🔍 Pre-booting iOS simulator..."

# Set device (customize as needed)
SIMULATOR_NAME="${SIMULATOR_NAME:-iPhone 16 Pro}"
IOS_VERSION="${IOS_VERSION:-}"  # Leave empty to auto-select any available iOS version

if [ -n "$IOS_VERSION" ]; then
  SIMULATOR_DEVICE="${SIMULATOR_NAME} (${IOS_VERSION})"
  echo "📱 Target: ${SIMULATOR_DEVICE}"
else
  SIMULATOR_DEVICE="${SIMULATOR_NAME}"
  echo "📱 Target: ${SIMULATOR_DEVICE} (any available iOS version)"
fi

# Find simulator UDID - either exact match with version or any match by name
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
  echo "⚠️  Warning: Could not find simulator '${SIMULATOR_DEVICE}'"
  echo "Available simulators:"
  xcrun simctl list devices available | grep "iOS"
  echo ""
  echo "Attempting to find any iPhone simulator..."

  # Fallback: find any booted iPhone simulator or boot the first available
  SIMULATOR_UDID=$(xcrun simctl list devices | grep "iPhone" | grep "Booted" | grep -o '[A-F0-9]\{8\}-[A-F0-9]\{4\}-[A-F0-9]\{4\}-[A-F0-9]\{4\}-[A-F0-9]\{12\}' | head -n 1)

  if [ -z "$SIMULATOR_UDID" ]; then
    # No booted iPhone found, get first available iPhone
    SIMULATOR_UDID=$(xcrun simctl list devices available | grep "iPhone" | grep -o '[A-F0-9]\{8\}-[A-F0-9]\{4\}-[A-F0-9]\{4\}-[A-F0-9]\{4\}-[A-F0-9]\{12\}' | head -n 1)
  fi

  if [ -z "$SIMULATOR_UDID" ]; then
    echo "❌ Error: No iPhone simulator found"
    exit 1
  fi
fi

echo "📱 Using UDID: ${SIMULATOR_UDID}"

# Check if already booted
SIMULATOR_STATE=$(xcrun simctl list devices | grep "${SIMULATOR_UDID}" | sed -n 's/.*(\(.*\)).*/\1/p')

if [ "$SIMULATOR_STATE" = "Booted" ]; then
  echo "✅ Simulator already booted"
  exit 0
fi

# Boot the simulator
echo "🚀 Booting simulator..."
xcrun simctl boot "${SIMULATOR_UDID}" 2>/dev/null || true

# Wait for boot (max 120 seconds)
echo "⏳ Waiting for simulator to boot..."
for i in {1..120}; do
  SIMULATOR_STATE=$(xcrun simctl list devices | grep "${SIMULATOR_UDID}" | sed -n 's/.*(\(.*\)).*/\1/p')
  if [ "$SIMULATOR_STATE" = "Booted" ]; then
    echo "✅ Simulator booted successfully"

    # Give it a few extra seconds to fully initialize
    echo "⏳ Waiting for simulator to fully initialize..."
    sleep 5

    exit 0
  fi

  if [ $((i % 10)) -eq 0 ]; then
    echo "   Still waiting... (${i}s)"
  fi

  sleep 1
done

echo "❌ Error: Simulator failed to boot in time"
exit 1
