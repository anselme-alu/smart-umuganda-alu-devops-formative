# Backend

Express.js API server written in TypeScript.

## Prerequisites

- [Node.js](https://nodejs.org/) v20+
- [Yarn](https://yarnpkg.com/) v1 (classic)

## Setup

```bash
cd backend
yarn install
```

## Available Scripts

| Script              | Description                            |
|---------------------|----------------------------------------|
| `yarn dev`          | Start the dev server with hot reload   |
| `yarn compile`      | Compile TypeScript to `dist/`          |
| `yarn build`        | Alias for compile                      |
| `yarn check-types`  | Type-check without emitting files      |
| `yarn format`       | Auto-format source files with Prettier |
| `yarn format:check` | Check formatting without writing       |
| `yarn lint`         | Run ESLint                             |
| `yarn lint:fix`     | Run ESLint and auto-fix                |
| `yarn test`         | Run unit tests (Vitest, no watch)      |

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
