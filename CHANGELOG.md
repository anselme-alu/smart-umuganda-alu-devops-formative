# Changelog

All notable changes to **Smart Umuganda** across the ALU DevOps formative and summative phases.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).  
Phases: **F1** (Formative 1) · **F2** (Formative 2) · **Summative**

---

## Summative — AWS deployment & full CI/CD (2026-07)

### Added

- **AWS infrastructure** with Terraform (`terraform/`) — VPC, public/private subnets, security groups, EC2 + Elastic IP, RDS PostgreSQL
- **Configuration management** with Ansible (`ansible/`) — Docker install, UFW/fail2ban hardening, application deploy via Docker Compose on EC2
- **Continuous delivery** workflow (`.github/workflows/cd.yaml`) — Terraform plan/apply → Ansible deploy → smoke test on merge to `main`
- **Remote Terraform state** in S3 with encryption and versioning
- **DevSecOps scanning** in CI — `yarn audit`, Trivy (container OS), tfsec (IaC); documented in [`SECURITY.md`](./SECURITY.md)
- **Live production deployment** at [http://98.91.144.193](http://98.91.144.193) (login: [/auth/login](http://98.91.144.193/auth/login))
- **Operations tooling** — `scripts/smoke-test.sh` (shared by CD verify job), root `Makefile`, enriched `/health` endpoint with service metadata

### Changed

- CI refactored to reusable workflow (`ci.yml`) invoked by `main.yaml`; CD gated behind successful CI on `main`
- CD smoke test consolidated into `scripts/smoke-test.sh` to avoid drift between local checks, GitHub Actions, and Ansible
- `/health` now returns `service`, `version`, and `uptimeSeconds` for monitoring and post-deploy verification
- Frontend production build injects `VITE_API_URL` at Docker build time for deployed API routing
- README expanded as operations manual with architecture diagrams and deployment documentation

---

## F2 — Containerization & CI pipeline (2026-07)

### Added

- Root **`Dockerfile`**, **`.dockerignore`**, and **`docker-compose.yml`** for the full stack (Postgres, backend, frontend)
- Per-service Dockerfiles with multi-stage builds, non-root users, and health checks
- **`.github/workflows/ci.yml`** — lint, test, and Docker image build on feature branches and pull requests to `main`
- **`SECURITY.md`** scaffolding for future security documentation

### Changed

- Backend and frontend validated automatically on every push (except direct pushes to `main`) and on PRs
- README updated with Docker Compose instructions and CI/CD overview

---

## F1 — Application foundation (2026-06)

### Added

- **Backend** — Express 5 + TypeScript API with Drizzle ORM, PostgreSQL, JWT auth, and role-based access control
- **Frontend** — React 19 + Vite + Tailwind CSS single-page application
- **Core features** — Umuganda events, attendance, announcements, issue reporting, admin user/location management
- **Initial GitHub Actions CI** — backend lint, build, and test workflows
- **Project documentation** — root, backend, and frontend README files; team project board

### Changed

- Iterative feature delivery via pull requests with code review (`feat/auth-pages`, `ft/event-features`, `features/community-engagements`, and related PRs)

---

## Evolution at a glance

| Phase | Focus | Key outcome |
| ----- | ----- | ----------- |
| **F1** | Full-stack application | Working civic engagement platform with tests and basic CI |
| **F2** | Containerization & CI | Dockerized stack; automated lint, test, and image build |
| **Summative** | IaC, CM, CD & security | Deployed on AWS with Terraform + Ansible; CD pipeline; security scans |
