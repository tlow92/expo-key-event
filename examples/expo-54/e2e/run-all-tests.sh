#!/bin/bash

REPORT_DIR="e2e/reports"
mkdir -p "$REPORT_DIR"

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo "=========================================="
echo "Running E2E Tests for All Platforms"
echo "=========================================="
echo ""

# Track results
RESULTS=""
IOS_STATUS="SKIPPED"
ANDROID_STATUS="SKIPPED"
WEB_STATUS="SKIPPED"

# iOS Tests
echo "=========================================="
echo "Running iOS Tests..."
echo "=========================================="
./e2e/ios-build-and-test.sh
if [ $? -eq 0 ]; then
    RESULTS="${RESULTS}✓ iOS tests passed\n"
    IOS_STATUS="PASSED"
else
    RESULTS="${RESULTS}✗ iOS tests failed\n"
    IOS_STATUS="FAILED"
fi
echo ""

# Android Tests
echo "=========================================="
echo "Running Android Tests..."
echo "=========================================="
./e2e/android-build-and-test.sh
if [ $? -eq 0 ]; then
    RESULTS="${RESULTS}✓ Android tests passed\n"
    ANDROID_STATUS="PASSED"
elif [ $? -eq 2 ]; then
    RESULTS="${RESULTS}⊘ Android tests skipped (no device)\n"
    ANDROID_STATUS="SKIPPED"
else
    RESULTS="${RESULTS}✗ Android tests failed\n"
    ANDROID_STATUS="FAILED"
fi
echo ""

# Web Tests
echo "=========================================="
echo "Running Web Tests..."
echo "=========================================="
./e2e/web-build-and-test.sh
if [ $? -eq 0 ]; then
    RESULTS="${RESULTS}✓ Web tests passed\n"
    WEB_STATUS="PASSED"
else
    RESULTS="${RESULTS}✗ Web tests failed\n"
    WEB_STATUS="FAILED"
fi
echo ""

# Summary
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "$RESULTS"
echo ""
echo "Reports:"
[ "$IOS_STATUS" != "SKIPPED" ] && echo "  iOS:     $REPORT_DIR/ios-results.xml"
[ "$ANDROID_STATUS" != "SKIPPED" ] && echo "  Android: $REPORT_DIR/android-results.xml"
[ "$WEB_STATUS" != "SKIPPED" ] && echo "  Web:     $REPORT_DIR/web-results.xml"
echo ""

# Exit with error if any tests failed
if [ "$IOS_STATUS" = "FAILED" ] || [ "$ANDROID_STATUS" = "FAILED" ] || [ "$WEB_STATUS" = "FAILED" ]; then
    echo -e "${RED}Some tests failed. Check reports for details.${NC}"
    exit 1
else
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
fi
