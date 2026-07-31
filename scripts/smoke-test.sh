#!/usr/bin/env bash
# Post-deploy smoke test — same checks as the CD verify job in .github/workflows/cd.yaml
set -euo pipefail

APPLICATION_URL="${APPLICATION_URL:-http://98.91.144.193}"
API_URL="${API_URL:-http://98.91.144.193:8000/api}"

if [[ -n "${INSTANCE_IP:-}" ]]; then
  APPLICATION_URL="${APPLICATION_URL:-http://${INSTANCE_IP}}"
  API_URL="${API_URL:-http://${INSTANCE_IP}:8000/api}"
fi

HEALTH_URL="${HEALTH_URL:-${API_URL%/api}/health}"
BACKEND_ATTEMPTS="${SMOKE_BACKEND_ATTEMPTS:-10}"
BACKEND_DELAY="${SMOKE_BACKEND_DELAY:-10}"

echo "Smoke test"
echo "  Frontend: ${APPLICATION_URL}"
echo "  Health:   ${HEALTH_URL}"

for attempt in $(seq 1 "${BACKEND_ATTEMPTS}"); do
  if curl -fsS --max-time 10 "${HEALTH_URL}"; then
    echo ""
    echo "Backend healthy."
    break
  fi
  if [[ "${attempt}" -eq "${BACKEND_ATTEMPTS}" ]]; then
    echo "Backend health check failed after ${BACKEND_ATTEMPTS} attempts." >&2
    exit 1
  fi
  echo "Attempt ${attempt}/${BACKEND_ATTEMPTS} failed, retrying in ${BACKEND_DELAY}s..."
  sleep "${BACKEND_DELAY}"
done

status="$(curl -sS -o /dev/null -w '%{http_code}' --max-time 15 "${APPLICATION_URL}")"
echo "Frontend returned HTTP ${status}"
if [[ "${status}" != "200" ]]; then
  echo "Frontend smoke test failed." >&2
  exit 1
fi

echo "Smoke test passed."
