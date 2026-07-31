# Smart Umuganda

> Connecting communities through digital civic engagement.

## African Context

In Rwanda, Umuganda is a monthly community work day where citizens come together to build and maintain public infrastructure. Despite its cultural importance, community leaders still rely on manual processes — paper sign-in sheets, word-of-mouth announcements, and phone calls — to coordinate participation and track outcomes. This results in low awareness, poor attendance records, and limited accountability for local development projects.

Smart Umuganda digitizes the entire community engagement cycle: residents discover upcoming activities, leaders publish announcements, citizens report local issues, and attendance is tracked automatically. By bringing these workflows online, Smart Umuganda makes Rwanda's most valuable civic tradition more accessible, transparent, and impactful.

## Team Members

| Name | Role | Email |
| ---- | ---- | ----- |
| Anselme Irumva Habumugisha | Software Engineer | a.irumva@alustudent.com |
| Nshimiyandinze Fiston | Software Engineer | n.fiston@alustudent.com |

## Project Overview

Smart Umuganda is a full-stack civic engagement platform built to modernize Rwanda's monthly community work tradition. The application connects citizens with their local community leaders through a shared digital space where upcoming Umuganda events are visible, announcements are broadcast, and local issues are surfaced and tracked.

On the backend, a RESTful API built with Node.js, Express 5, and TypeScript manages authentication, user profiles, community events, attendance records, and issue reports. Data is persisted in PostgreSQL 16 via Drizzle ORM, and the API enforces role-based access control to distinguish between citizens, community leaders, and administrators.

On the frontend, a React 19 single-page application provides an intuitive interface tailored to each user role. Citizens can browse events, register attendance, and submit issue reports. Leaders and administrators can create events, post announcements, manage users, and review community project progress. The entire stack is containerized with Docker and continuously validated through GitHub Actions CI pipelines.

### Target Users

- **Citizens** — discover local events, register attendance, and report community issues
- **Community leaders** — publish events and announcements, track participation
- **Local authorities** — monitor project progress and review community reports

### Core Features

- **Event management**: create, list, and manage upcoming Umuganda activities
- **Attendance tracking**: citizens register for events; leaders see real-time attendance
- **Community announcements**: leaders broadcast news to their local community
- **Issue reporting**: citizens flag local infrastructure or social problems
- **Role-based access**: separate dashboards and permissions for each user type

## Technology Stack

| Layer    | Technology                     |
| -------- | ------------------------------ |
| Frontend | React 19, Tailwind CSS, Vite   |
| Backend  | Node.js, Express 5, TypeScript |
| Database | PostgreSQL 16, Drizzle ORM     |
| DevOps   | GitHub Actions, Docker         |

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [Yarn](https://yarnpkg.com/) v1 (classic)
- [Docker](https://www.docker.com/) (for the database)

### Installation

1. Clone the repository

```bash
git clone https://github.com/anselme-alu/smart-umuganda-alu-devops-formative.git
cd smart-umuganda-alu-devops-formative
```

2. Start the database

```bash
docker compose -f docker-compose.db.yml up -d
```

3. Set up and start the backend

```bash
cd backend
cp .env.example .env   # edit values if needed
yarn install
yarn db:migrate
yarn dev               # http://localhost:8000
```

4. Set up and start the frontend (new terminal)

```bash
cd frontend
yarn install
yarn dev               # http://localhost:5173
```

### Usage

Open [http://localhost:5173](http://localhost:5173) in your browser. Register an account to get started as a citizen, or use a seeded leader/admin account (see [backend/README.md](./backend/README.md)) to access the management dashboard.

## Project Structure

```
smart-umuganda/
├── backend/               # Express API — Dockerfile, .dockerignore, README.md
├── frontend/              # React app  — Dockerfile, .dockerignore, README.md
├── .github/
│   └── workflows/         # CI/CD pipelines
├── Dockerfile             # Root backend container configuration
├── docker-compose.yml     # Full stack: database + backend + frontend
├── docker-compose.yaml    # Alias of docker-compose.yml
├── docker-compose.db.yml  # Database only (for local dev)
├── Makefile
└── README.md
```

## Docker

The whole application is containerized with multi-stage builds, non-root users, and health checks.

| Service     | Image base         | Port  | Notes                                        |
| ----------- | ------------------ | ----- | -------------------------------------------- |
| `datastore` | `postgres:16`      | 5432  | PostgreSQL with a persistent volume          |
| `backend`   | `node:24-alpine`   | 8000  | Root `Dockerfile` — migrations on startup    |
| `frontend`  | `nginx:1.27-alpine`| 5001  | Static build served by nginx                 |

**Required files:**

| File                | Purpose                                      |
| ------------------- | -------------------------------------------- |
| `Dockerfile`        | Root backend container (multi-stage, non-root)|
| `docker-compose.yml`| Full stack orchestration                     |
| `.dockerignore`     | Trims build context                          |

Two compose files are provided:

- **[`docker-compose.yml`](./docker-compose.yml)** — builds and runs the full stack (database, backend, frontend) with service dependencies, health checks, and restart policies.
- **[`docker-compose.db.yml`](./docker-compose.db.yml)** — the database only, for local development while running the apps with `yarn dev`.

Run the entire stack with a single command:

```bash
docker compose -f docker-compose.yml up --build
```

Then open [http://localhost:5001](http://localhost:5001). The backend is available at `http://localhost:8000`.

## CI/CD

| Workflow  | Trigger                           | What it does                                                                             |
| --------- | --------------------------------- | ---------------------------------------------------------------------------------------- |
| `ci.yml`  | Push (except `main`), PR → `main` | Lint, test, Docker build, `terraform fmt`/`validate`; on PRs also dependency, Trivy and tfsec scans |
| `cd.yaml` | Push to `main`, commit markers, manual dispatch | `terraform apply` → Ansible deploy → smoke test against the live URLs        |

The CI pipeline fails if linting, tests, Docker builds, or **high-severity security scans** fail. See [`SECURITY.md`](./SECURITY.md) for scan details and documented findings.

### Continuous delivery

`cd.yaml` runs the full pipeline — infrastructure ([`terraform/`](./terraform)), configuration and deployment ([`ansible/`](./ansible)), then verification:

```
gate ──► terraform (fmt, validate, plan, apply) ──► deploy (Ansible) ──► verify (smoke test)
```

It triggers on:

| Trigger                                              | Terraform action | Ansible deploy |
| ---------------------------------------------------- | ---------------- | -------------- |
| Push to `main`                                        | `apply`          | yes            |
| Commit message contains `[terraform apply]` (any branch) | `apply`       | yes            |
| Commit message contains `[terraform plan]` (any branch)  | `plan` only   | no             |
| Commit message contains `[terraform destroy]` (any branch) | `destroy`   | no             |
| Manual **Run workflow** (`workflow_dispatch`)         | your choice      | optional       |

Opt-outs: `[skip cd]` disables the run entirely, `[skip ansible]` provisions infrastructure without redeploying the application.

Every run publishes the Terraform plan, the resulting endpoints, and the smoke-test result to the workflow summary. Runs are serialized with a repository-wide concurrency group so two pushes can never fight over the Terraform state lock.

### Required GitHub secrets

Settings → Secrets and variables → Actions → **Secrets**:

| Secret                  | Required                       | Value                                                                       |
| ----------------------- | ------------------------------ | --------------------------------------------------------------------------- |
| `AWS_ACCESS_KEY_ID`     | yes (unless using OIDC)        | Access key of the IAM user holding [`terraform/iam-policy.json`](./terraform/iam-policy.json) |
| `AWS_SECRET_ACCESS_KEY` | yes (unless using OIDC)        | Matching secret access key                                                   |
| `SSH_PUBLIC_KEY`        | yes                            | Contents of `terraform/smart-umuganda-key.pub` — installed on the instance   |
| `SSH_PRIVATE_KEY`       | yes                            | Contents of `terraform/smart-umuganda-key` — used by Ansible to connect      |
| `JWT_SECRET`            | yes                            | Long random string for the API (`openssl rand -hex 32`)                      |
| `DB_PASSWORD`           | no                             | Pins the RDS master password; omit and Terraform generates one and keeps it in remote state |

Settings → Secrets and variables → Actions → **Variables** (all optional, defaults shown):

| Variable               | Default                                   | Purpose                                              |
| ---------------------- | ----------------------------------------- | ---------------------------------------------------- |
| `AWS_REGION`           | `us-east-1`                               | Region for every resource                            |
| `TF_STATE_BUCKET`      | `smart-umuganda-tfstate-<account-id>`     | Remote state bucket (created automatically if absent) |
| `TF_PROJECT_NAME`      | `smart-umuganda`                          | Resource name/tag prefix                             |
| `TF_ENVIRONMENT`       | `dev`                                     | `dev` \| `staging` \| `prod`                          |
| `TF_INSTANCE_TYPE`     | `t3.micro`                                | EC2 size                                             |
| `TF_DB_INSTANCE_CLASS` | `db.t3.micro`                             | RDS size                                             |
| `SSH_ALLOWED_CIDR`     | `0.0.0.0/0`                               | CIDR allowed to reach port 22                        |
| `AWS_ROLE_TO_ASSUME`   | _(unset)_                                 | Set to an IAM role ARN to authenticate via GitHub OIDC instead of access keys |

> **Before the first CD run**, migrate the existing local Terraform state to S3 — see [terraform/README.md](./terraform/README.md#remote-state).

## Links

- [Project Board](https://github.com/users/anselme-alu/projects/1)
- [Backend Documentation](./backend/README.md)
- [Frontend Documentation](./frontend/README.md)
- [Team collaboration sheet](https://docs.google.com/spreadsheets/d/1DSzKnZjLoce4OMATBgfHCLmnEqlwf7LKUY_8CONuzs8/edit?usp=sharing)

## License

MIT License
