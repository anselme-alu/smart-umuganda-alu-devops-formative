.PHONY: help smoke-test docker-up docker-down docker-logs ci-backend ci-frontend

APPLICATION_URL ?= http://98.91.144.193
API_URL ?= http://98.91.144.193:8000/api
INSTANCE_IP ?=

help:
	@echo "Smart Umuganda — common operations"
	@echo ""
	@echo "  make smoke-test      Verify live or local deployment (frontend + /health)"
	@echo "  make docker-up       Build and start the full Docker Compose stack"
	@echo "  make docker-down     Stop the Docker Compose stack"
	@echo "  make docker-logs     Tail logs from all compose services"
	@echo "  make ci-backend      Run backend lint and tests locally"
	@echo "  make ci-frontend     Run frontend lint and tests locally"

smoke-test:
	@chmod +x scripts/smoke-test.sh
	@APPLICATION_URL="$(APPLICATION_URL)" API_URL="$(API_URL)" INSTANCE_IP="$(INSTANCE_IP)" ./scripts/smoke-test.sh

docker-up:
	docker compose -f docker-compose.yml up --build -d

docker-down:
	docker compose -f docker-compose.yml down

docker-logs:
	docker compose -f docker-compose.yml logs -f

ci-backend:
	cd backend && yarn install --frozen-lockfile && yarn format:check && yarn lint && yarn test

ci-frontend:
	cd frontend && yarn install --frozen-lockfile && yarn format:check && yarn lint && yarn test
