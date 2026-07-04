# Smart Umuganda — Backend

Express 5 API server written in TypeScript, backed by PostgreSQL via Drizzle ORM.

→ [Root README](../README.md) for full project setup including the database.

## Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [Yarn](https://yarnpkg.com/) v1 (classic)
- A running PostgreSQL instance (see [docker-compose.db.yml](../docker-compose.db.yml))

## Setup

```bash
cd backend
cp .env.example .env   # fill in DATABASE_URL, JWT_SECRET, PORT
yarn install
yarn db:migrate        # apply pending migrations
```

## Available Scripts

| Script              | Description                            |
| ------------------- | -------------------------------------- |
| `yarn dev`          | Start the dev server with hot reload   |
| `yarn build`        | Compile TypeScript to `dist/`          |
| `yarn check-types`  | Type-check without emitting files      |
| `yarn format`       | Auto-format source files with Prettier |
| `yarn format:check` | Check formatting without writing       |
| `yarn lint`         | Run ESLint                             |
| `yarn lint:fix`     | Run ESLint and auto-fix                |
| `yarn test`         | Run unit tests (Vitest, no watch)      |
| `yarn test:coverage`| Run tests with coverage report         |
| `yarn db:generate`  | Generate a new Drizzle migration       |
| `yarn db:migrate`   | Apply pending migrations               |
| `yarn db:push`      | Push schema changes directly (dev)     |
| `yarn db:studio`    | Open Drizzle Studio                    |

## Development

```bash
yarn dev
```

The server starts on `http://localhost:8000` by default. Set the `PORT` environment variable to change it.

## Testing

Tests use [Vitest](https://vitest.dev/). Test files live alongside source files with the `.test.ts` suffix.

```bash
yarn test
```

## Docker

A multi-stage [`Dockerfile`](./Dockerfile) builds the API: the first stage compiles TypeScript, the final stage runs only production dependencies on `node:24-alpine`. On startup the container applies pending migrations, then launches the server.

- **`.dockerignore`** keeps `node_modules/`, `dist/`, and `coverage/` out of the build context.

Build and run standalone:

```bash
docker build -t smart-umuganda-backend .
docker run -p 8000:8000 --env-file .env smart-umuganda-backend
```

The backend is normally started via the root [`docker-compose.yaml`](../docker-compose.yaml), which wires it to the Postgres container. See the [Root README](../README.md#docker) for the full stack.
