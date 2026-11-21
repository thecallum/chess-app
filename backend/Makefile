# Backend commands. Run from this directory (backend/).
COMPOSE     = docker compose -f ../docker-compose.yml
COMPOSE_DEV = $(COMPOSE) -f docker-compose.dev.yml

.DEFAULT_GOAL := help
.PHONY: help dev dev-detached down logs build test

help: ## List commands
	@grep -E '^[a-z-]+:.*## ' $(MAKEFILE_LIST) | awk -F':.*## ' '{printf "  %-14s %s\n", $$1, $$2}'

dev: ## Run the API in Docker with hot reload (http://localhost:5080)
	$(COMPOSE_DEV) up api

dev-detached: ## Same as dev, in the background
	$(COMPOSE_DEV) up -d api

down: ## Stop and remove the containers
	$(COMPOSE) down

logs: ## Follow the API logs
	$(COMPOSE) logs -f api

build: ## Build the production API image
	$(COMPOSE) build api

test: ## Run the backend tests
	dotnet test
