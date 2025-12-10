#!/bin/bash

# Debug script to test simulator detection logic

SIMULATOR_NAME="${SIMULATOR_NAME:-iPhone 16 Pro}"
IOS_VERSION="${IOS_VERSION:-}"

echo "🔍 Testing simulator detection..."
echo "SIMULATOR_NAME: '${SIMULATOR_NAME}'"
echo "IOS_VERSION: '${IOS_VERSION}'"
echo ""

echo "=== Full simctl output (with 'available' filter) ==="
xcrun simctl list devices available
echo ""

echo "=== Testing search logic ==="

if [ -n "$IOS_VERSION" ]; then
  echo "Searching for: ${SIMULATOR_NAME} with iOS ${IOS_VERSION}"
  echo ""

  echo "Method 1: Using awk"
  UDID1=$(xcrun simctl list devices available | awk -v ios="$IOS_VERSION" -v device="$SIMULATOR_NAME" '
    /^-- iOS/ {
      current_ios = $0
      gsub(/^-- iOS /, "", current_ios)
      gsub(/ --$/, "", current_ios)
      print "DEBUG: Found iOS section: " current_ios > "/dev/stderr"
    }
    current_ios == ios && $0 ~ device {
      print "DEBUG: Found device match in correct iOS section: " $0 > "/dev/stderr"
      match($0, /[A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12}/)
      if (RSTART > 0) {
        print substr($0, RSTART, RLENGTH)
        exit
      }
    }
  ' 2>&1)
  echo "Result: '${UDID1}'"
  echo ""

else
  echo "Searching for: ${SIMULATOR_NAME} (any iOS version)"
  echo ""

  echo "Method 2: Using grep (simple)"
  echo "Matching lines:"
  xcrun simctl list devices available | grep "${SIMULATOR_NAME}"
  echo ""

  UDID2=$(xcrun simctl list devices available | grep "${SIMULATOR_NAME}" | grep -o '[A-F0-9]\{8\}-[A-F0-9]\{4\}-[A-F0-9]\{4\}-[A-F0-9]\{4\}-[A-F0-9]\{12\}' | head -n 1)
  echo "Extracted UDID: '${UDID2}'"
  echo ""
fi

echo "=== Alternative: Without 'available' filter ==="
echo "All devices matching '${SIMULATOR_NAME}':"
xcrun simctl list devices | grep "${SIMULATOR_NAME}" | head -5
