#!/usr/bin/env bash
# ─────────────────────────────────────────────────────────────────────────────
# CraftPolicy Legal Audit — Production Smoke Test
#
# Usage:
#   ./scripts/smoke-test.sh https://toc-audit-backend.up.railway.app <API_KEY>
#
# Exit code 0 = all checks passed; non-zero = failure.
# ─────────────────────────────────────────────────────────────────────────────

set -euo pipefail

BACKEND_URL="${1:-http://localhost:3001}"
API_KEY="${2:-}"

PASS=0
FAIL=0
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

ok()   { echo -e "  ${GREEN}✓${NC} $1"; ((PASS++)); }
fail() { echo -e "  ${RED}✗${NC} $1"; ((FAIL++)); }
info() { echo -e "  ${YELLOW}→${NC} $1"; }

echo ""
echo "CraftPolicy Smoke Test"
echo "Backend: ${BACKEND_URL}"
echo "────────────────────────────────────────"

# ── 1. Health check ──────────────────────────────────────────────────────────
info "1. Health check"
STATUS=$(curl -sf -o /dev/null -w "%{http_code}" "${BACKEND_URL}/health" || echo "000")
if [ "$STATUS" = "200" ]; then
  ok "GET /health → 200"
else
  fail "GET /health → ${STATUS} (expected 200)"
fi

# ── 2. Questions endpoint (public) ───────────────────────────────────────────
info "2. Questions endpoint"
BODY=$(curl -sf "${BACKEND_URL}/api/toc/questions?business_type=ecommerce" || echo "ERROR")
if echo "$BODY" | grep -q "skip_criteria_if_false"; then
  ok "GET /api/toc/questions → returns questions with skip logic"
else
  fail "GET /api/toc/questions → unexpected response: ${BODY:0:120}"
fi

# ── 3. Auth middleware (no key) ───────────────────────────────────────────────
info "3. Auth middleware"
STATUS=$(curl -sf -o /dev/null -w "%{http_code}" "${BACKEND_URL}/api/toc/dashboard" || echo "000")
if [ "$STATUS" = "401" ]; then
  ok "GET /api/toc/dashboard without key → 401"
else
  fail "GET /api/toc/dashboard without key → ${STATUS} (expected 401)"
fi

# ── 4. Auth middleware (wrong key) ───────────────────────────────────────────
STATUS=$(curl -sf -o /dev/null -w "%{http_code}" \
  -H "x-api-key: wrong-key" \
  "${BACKEND_URL}/api/toc/dashboard" || echo "000")
if [ "$STATUS" = "401" ]; then
  ok "GET /api/toc/dashboard with wrong key → 401"
else
  fail "GET /api/toc/dashboard with wrong key → ${STATUS} (expected 401)"
fi

# ── 5. Dashboard with valid key ───────────────────────────────────────────────
if [ -n "$API_KEY" ]; then
  info "5. Dashboard with valid key"
  BODY=$(curl -sf -H "x-api-key: ${API_KEY}" "${BACKEND_URL}/api/toc/dashboard" || echo "ERROR")
  if echo "$BODY" | grep -q "audits"; then
    ok "GET /api/toc/dashboard → returns audits array"
  else
    fail "GET /api/toc/dashboard → unexpected response: ${BODY:0:120}"
  fi
else
  info "5. Skipping dashboard auth test (no API_KEY provided)"
fi

# ── 6. Status for non-existent UID ───────────────────────────────────────────
info "6. 404 on unknown UID"
STATUS=$(curl -sf -o /dev/null -w "%{http_code}" \
  "${BACKEND_URL}/api/toc/nonexistent-uid-00000/status" || echo "000")
if [ "$STATUS" = "404" ]; then
  ok "GET /api/toc/nonexistent-uid/status → 404"
else
  fail "GET /api/toc/nonexistent-uid/status → ${STATUS} (expected 404)"
fi

# ── 7. Start — missing required fields → 400 ────────────────────────────────
if [ -n "$API_KEY" ]; then
  info "7. Validation: missing required fields"
  STATUS=$(curl -sf -o /dev/null -w "%{http_code}" \
    -X POST \
    -H "x-api-key: ${API_KEY}" \
    -F "client_name=" \
    "${BACKEND_URL}/api/toc/start" || echo "000")
  if [ "$STATUS" = "400" ]; then
    ok "POST /api/toc/start (empty client_name) → 400"
  else
    fail "POST /api/toc/start (empty client_name) → ${STATUS} (expected 400)"
  fi
else
  info "7. Skipping start validation test (no API_KEY provided)"
fi

# ── Summary ───────────────────────────────────────────────────────────────────
echo "────────────────────────────────────────"
TOTAL=$((PASS + FAIL))
echo -e "  ${TOTAL} checks: ${GREEN}${PASS} passed${NC}, ${RED}${FAIL} failed${NC}"
echo ""

if [ "$FAIL" -gt 0 ]; then
  exit 1
fi
exit 0
