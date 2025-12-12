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

# iOS Tests
echo "=========================================="
echo "Running iOS Tests..."
echo "=========================================="
if ./e2e/ios-build-and-test.sh; then
    RESULTS="${RESULTS}${GREEN}✓ iOS tests passed${NC}\n"
    IOS_STATUS="PASSED"
else
    RESULTS="${RESULTS}${RED}✗ iOS tests failed${NC}\n"
    IOS_STATUS="FAILED"
fi
echo ""

# Android Tests
echo "=========================================="
echo "Running Android Tests..."
echo "=========================================="
if ./e2e/android-build-and-test.sh; then
    RESULTS="${RESULTS}${GREEN}✓ Android tests passed${NC}\n"
    ANDROID_STATUS="PASSED"
else
    RESULTS="${RESULTS}${RED}✗ Android tests failed${NC}\n"
    ANDROID_STATUS="FAILED"
fi
echo ""

# Web Tests
echo "=========================================="
echo "Running Web Tests..."
echo "=========================================="
if ./e2e/web-build-and-test.sh; then
    RESULTS="${RESULTS}${GREEN}✓ Web tests passed${NC}\n"
    WEB_STATUS="PASSED"
else
    RESULTS="${RESULTS}${RED}✗ Web tests failed${NC}\n"
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
echo "  iOS:     $REPORT_DIR/ios-results.xml"
echo "  Android: $REPORT_DIR/android-results.xml"
echo "  Web:     $REPORT_DIR/web-results.xml"
echo ""
echo "Logs available in: $REPORT_DIR/"
echo ""

# Exit with error if any tests failed
if [ "$IOS_STATUS" = "FAILED" ] || [ "$ANDROID_STATUS" = "FAILED" ] || [ "$WEB_STATUS" = "FAILED" ]; then
    echo -e "${RED}Some tests failed. Check reports for details.${NC}"
    exit 1
else
    echo -e "${GREEN}All tests passed!${NC}"
    exit 0
fi
