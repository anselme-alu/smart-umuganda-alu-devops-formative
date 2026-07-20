# Stage 1 — compile the TypeScript backend API
FROM node:24-alpine AS builder

WORKDIR /app

# Copy dependency manifests first so Docker can cache this layer when source changes
COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

RUN yarn build

# Stage 2 — lean production image
FROM node:24-alpine

RUN apk upgrade --no-cache

# Run as a dedicated non-root user (security best practice)
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/drizzle ./drizzle
COPY package.json yarn.lock ./

RUN yarn install --production --frozen-lockfile && \
    yarn cache clean && \
    rm -rf /root/.cache /usr/local/share/.cache/yarn && \
    chown -R appuser:appgroup /app

USER appuser

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=15s --retries=3 \
  CMD node -e "fetch('http://127.0.0.1:8000/health').then(r=>process.exit(r.ok?0:1)).catch(()=>process.exit(1))"

# Apply pending migrations, then start the API server
CMD ["sh", "-c", "yarn db:migrate:run && node dist/server.js"]
