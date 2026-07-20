# Stage 1 — build the React production bundle
FROM node:24-alpine3.24 AS builder

WORKDIR /app

# Copy dependency manifests first so Docker can cache this layer when source changes
COPY package.json yarn.lock ./

RUN yarn install --frozen-lockfile

COPY . .

# Injected at build time so the SPA knows where the API lives. Falls back to
# the localhost default in src/api/client.ts when unset (e.g. local builds).
ARG VITE_API_URL=""
ENV VITE_API_URL=$VITE_API_URL

RUN yarn build

# Stage 2 — serve static files with nginx
FROM nginx:1.27-alpine

# nginx:alpine ships with a non-root-capable setup; use the built-in nginx user
COPY --from=builder /app/dist /var/www/html
COPY configs/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -qO- http://127.0.0.1:80/ > /dev/null || exit 1

CMD ["nginx", "-g", "daemon off;"]
