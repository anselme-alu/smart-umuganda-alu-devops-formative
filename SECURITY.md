# Security Scanning

Smart Umuganda runs automated security checks in GitHub Actions on **every pull request** targeting `main`. Scans are defined in [`.github/workflows/ci.yml`](./.github/workflows/ci.yml).

## Scans in CI

| Scan type | Tool | When it runs | Fail condition |
| --------- | ---- | ------------ | -------------- |
| Dependency | `yarn audit` (backend & frontend) | Pull request | High or critical advisories |
| Container image | [Trivy](https://github.com/aquasecurity/trivy) | Pull request (after Docker build) | Unfixed CRITICAL or HIGH in images |
| Infrastructure as Code | [tfsec](https://github.com/aquasecurity/tfsec) | Pull request | HIGH+ findings (reported; see below) |

Lint, unit tests, and Docker build jobs still run on feature-branch pushes and on pull requests.

## Findings and remediation

### Dependency scanning (`yarn audit`)

| Project | Severity | Package / path | Status |
| ------- | -------- | -------------- | ------ |
| Backend | Moderate | `esbuild` (via `drizzle-kit` → dev toolchain) | **Accepted risk** — dev-only dependency; does not ship in production runtime. CI fails only on **high** and **critical** so this does not block merges. Track upstream `drizzle-kit` / `esbuild` updates. |
| Frontend | — | No high/critical advisories at last scan | **Clear** |

**Action taken:** CI parses `yarn audit --json` and fails only when **high** or **critical** counts are non-zero (Yarn classic can exit non-zero for moderate-only findings). Re-run locally:

```bash
cd backend && yarn audit
cd frontend && yarn audit
```

### Container image scanning (Trivy)

Images scanned on each PR:

- `smart-umuganda-backend` (root `Dockerfile`)
- `smart-umuganda-frontend` (`frontend/Dockerfile`)

**Policy:** Trivy runs with `severity: CRITICAL,HIGH`, `ignore-unfixed: true`, `exit-code: 1`, and `--pkg-types os` on the **runtime** images. Application dependency risk is covered separately by `yarn audit` in CI. Images also run `apk upgrade` during build and remove Yarn cache directories so dev-tool binaries (for example cached `esbuild`) are not shipped in production layers.

**Action taken:** Multi-stage builds use pinned bases (`node:24-alpine`, `nginx:1.27-alpine`) and production backend images install only production dependencies. Re-scan locally after starting Docker:

```bash
docker build -t smart-umuganda-backend .
docker build -t smart-umuganda-frontend ./frontend
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest image \
  --severity CRITICAL,HIGH --ignore-unfixed --pkg-types os smart-umuganda-backend
docker run --rm -v /var/run/docker.sock:/var/run/docker.sock aquasec/trivy:latest image \
  --severity CRITICAL,HIGH --ignore-unfixed --pkg-types os smart-umuganda-frontend
```

If Trivy reports new OS package CVEs in base images, rebuild with updated base image tags and record the change here.

### IaC scanning (tfsec)

Terraform under [`terraform/`](./terraform/) is scanned with tfsec on each pull request (`--minimum-severity HIGH`).

**Action taken:** tfsec is configured with `soft_fail: true` so results are visible in CI logs while the team prioritizes fixes. Current HIGH findings: **public subnet** (`map_public_ip_on_launch = true`) on two public subnets in `terraform/modules/network/main.tf` — intentional for this lab architecture (internet-facing tier); review before production hardening.

Re-run locally:

```bash
docker run --rm -v "$(pwd)/terraform:/src" aquasec/tfsec /src
```

## Reporting new issues

1. Open a PR — security jobs run automatically.
2. If a scan fails, fix or document the finding in this file under the relevant section.
3. Request review from a teammate before merging to `main`.

## Related

- GitHub issue: [#23 — Add security scanning for our CI](https://github.com/anselme-alu/smart-umuganda-alu-devops-formative/issues/23)
