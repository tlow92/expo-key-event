#!/bin/bash

set -e  # Exit on any error

REPORT_DIR="e2e/reports"
mkdir -p "$REPORT_DIR"

echo "==> [Web] Starting Metro bundler and running e2e tests..."
echo "==> [Web] Test report will be saved to: $REPORT_DIR/web-results.xml"

# Run concurrently with output redirected
concurrently --raw --kill-others \
  "npm run start > /dev/null 2>&1" \
  "sleep 10 && maestro test e2e/browser.e2e.yaml --headless --format junit --output $REPORT_DIR/web-results.xml"

TEST_EXIT_CODE=$?

echo ""
if [ $TEST_EXIT_CODE -eq 0 ]; then
    echo "==> [Web] Tests completed successfully! Report: $REPORT_DIR/web-results.xml"
    exit 0
else
    echo "==> [Web] Tests failed! Report: $REPORT_DIR/web-results.xml"
    exit 1
fi
