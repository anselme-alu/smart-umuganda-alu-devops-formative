# Smart Umuganda — Frontend

React 19 + Tailwind CSS + Vite.

## Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [Yarn](https://yarnpkg.com/) v1 (classic)

## Setup

```bash
cd frontend
yarn install
```

## Available Scripts

| Script                  | Description                            |
| ----------------------- | -------------------------------------- |
| `yarn dev`              | Start the Vite dev server              |
| `yarn build`            | Type-check and build to `dist/`        |
| `yarn preview`          | Preview the production build locally   |
| `yarn check-types`      | Type-check without emitting files      |
| `yarn format`           | Auto-format source files with Prettier |
| `yarn format:check`     | Check formatting without writing       |
| `yarn lint`             | Run ESLint                             |
| `yarn test`             | Run unit tests (Vitest, no watch)      |
| `yarn test:watch`       | Run tests in watch mode                |
| `yarn test:coverage`    | Run tests with coverage report         |

## Development

```bash
yarn dev
```

The app starts on `http://localhost:5173` by default.

Make sure the [backend](../backend/README.md) is running at `http://localhost:8000` before using API-dependent features.

## Testing

Tests use [Vitest](https://vitest.dev/). Test files live alongside source files with the `.test.ts` / `.test.tsx` suffix.

```bash
yarn test
```
