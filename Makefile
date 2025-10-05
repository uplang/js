# Makefile for UP JavaScript/TypeScript Parser

.PHONY: help
help: ## Show this help message
	@echo 'Usage: make [target]'
	@echo ''
	@echo 'Available targets:'
	@awk 'BEGIN {FS = ":.*?## "} /^[a-zA-Z_-]+:.*?## / {printf "  %-15s %s\n", $$1, $$2}' $(MAKEFILE_LIST)

.PHONY: test
test: lint ## Run tests and linter
	npm test

.PHONY: lint
lint: ## Run linter
	npm run lint

.PHONY: build
build: ## Build the library
	npm run build

.PHONY: clean
clean: ## Clean build artifacts
	rm -rf dist/
	rm -rf node_modules/

.PHONY: install
install: ## Install dependencies
	npm install

.PHONY: fmt
fmt: ## Format code
	npm run format

.PHONY: publish
publish: build ## Publish to npm
	npm publish

.PHONY: test-ci
test-ci: ## Run CI tests locally using act (requires: brew install act)
	act --container-architecture linux/amd64 -j test
	act --container-architecture linux/amd64 -j lint
	act --container-architecture linux/amd64 -j build

.DEFAULT_GOAL := test
