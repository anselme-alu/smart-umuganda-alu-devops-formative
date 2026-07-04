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
├── docker-compose.yaml    # Full stack: database + backend + frontend
├── docker-compose.db.yml  # Database only (for local dev)
├── Makefile
└── README.md
```

## Docker

The whole application is containerized. Each service has its own multi-stage `Dockerfile` and a `.dockerignore` that trims the build context (`node_modules/`, `dist/`, `coverage/`).

| Service    | Image base      | Port  | Notes                                        |
| ---------- | --------------- | ----- | -------------------------------------------- |
| `datastore`| `postgres:16`   | 5432  | PostgreSQL with a persistent volume          |
| `backend`  | `node:24-alpine`| 8000  | Runs migrations on startup, then the API     |
| `frontend` | `nginx:alpine`  | 5001  | Static build served by nginx                 |

Two compose files are provided:

- **[`docker-compose.yaml`](./docker-compose.yaml)** — builds and runs the full stack (database, backend, frontend) with service dependencies and health checks.
- **[`docker-compose.db.yml`](./docker-compose.db.yml)** — the database only, for local development while running the apps with `yarn dev`.

Run the entire stack:

```bash
docker compose up --build
```

Then open [http://localhost:5001](http://localhost:5001). The backend is available at `http://localhost:8000`.

## CI/CD

The project uses GitHub Actions for continuous integration.

| Workflow           | What it does                                      |
| ------------------ | ------------------------------------------------- |
| `backend-ci.yaml`  | Lint, type-check, and test the Express API        |
| `frontend-ci.yaml` | Lint, type-check, and build the React app         |
| `ci.yaml`          | Orchestrates both backend and frontend CI         |
| `cd.yaml`          | Deployment pipeline (in progress)                 |

## Links

- [Project Board](https://github.com/users/anselme-alu/projects/1)
- [Backend Documentation](./backend/README.md)
- [Frontend Documentation](./frontend/README.md)
- [Team collaboration sheet](https://docs.google.com/spreadsheets/d/1DSzKnZjLoce4OMATBgfHCLmnEqlwf7LKUY_8CONuzs8/edit?usp=sharing)

## License

MIT License
