
SHELL = /bin/bash
.SHELLFLAGS = -o pipefail -c
NODE_VERSION ?= $(shell [ -f .nvmrc ] && tr -d '\n' < .nvmrc || echo 20)

.PHONY: help
help: ## Print info about all commands
	@echo "Helper Commands:"
	@echo
	@grep -E '^[a-zA-Z0-9_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "    \033[01;32m%-20s\033[0m %s\n", $$1, $$2}'
	@echo
	@echo "NOTE: dependencies between commands are not automatic. Eg, you must run 'deps' and 'build' first, and after any changes"

.PHONY: build
build: ## Compile all modules
	pnpm build

.PHONY: sync-local-dev-service
sync-local-dev-service: ## Detect current LAN IP and update local app/backend env vars
	bash ./scripts/sync-local-dev-service.sh

.PHONY: test
test: ## Run all tests
	pnpm test

.PHONY: run-dev-env
run-dev-env: ## Run a "development environment" shell
	@$(MAKE) sync-local-dev-service
	bash -lc 'set -a; [ -f ".env" ] && . ".env"; [ -f ".env.local" ] && . ".env.local"; set +a; export NVM_DIR="$$HOME/.nvm"; [ -s "$$NVM_DIR/nvm.sh" ] || { echo "nvm not found at $$NVM_DIR/nvm.sh"; exit 1; }; . "$$NVM_DIR/nvm.sh"; nvm use $(NODE_VERSION) >/dev/null; cd packages/dev-env; NODE_ENV=development pnpm run start'

.PHONY: run-dev-env-logged
run-dev-env-logged: ## Run a "development environment" shell (with logging)
	@$(MAKE) sync-local-dev-service
	bash -lc 'set -a; [ -f ".env" ] && . ".env"; [ -f ".env.local" ] && . ".env.local"; set +a; export NVM_DIR="$$HOME/.nvm"; [ -s "$$NVM_DIR/nvm.sh" ] || { echo "nvm not found at $$NVM_DIR/nvm.sh"; exit 1; }; . "$$NVM_DIR/nvm.sh"; nvm use $(NODE_VERSION) >/dev/null; cd packages/dev-env; LOG_ENABLED=true NODE_ENV=development pnpm run start | pnpm exec pino-pretty'

.PHONY: run-dev-env-persistent
run-dev-env-persistent: ## Run dev-env backed by persistent local Postgres/Redis and fixed PDS storage
	@$(MAKE) sync-local-dev-service
	bash -lc 'set -a; [ -f ".env" ] && . ".env"; [ -f ".env.local" ] && . ".env.local"; [ -f ".env.shared-demo" ] && . ".env.shared-demo"; [ -f ".env.shared-demo.local" ] && . ".env.shared-demo.local"; set +a; export DEV_ENV_PERSISTENT=true; export DEV_ENV_PLC_DB_POSTGRES_URL="$${DEV_ENV_PLC_DB_POSTGRES_URL:-$${DB_POSTGRES_URL:-}}"; export NVM_DIR="$$HOME/.nvm"; [ -s "$$NVM_DIR/nvm.sh" ] || { echo "nvm not found at $$NVM_DIR/nvm.sh"; exit 1; }; . "$$NVM_DIR/nvm.sh"; nvm use $(NODE_VERSION) >/dev/null; cd packages/dev-env; NODE_ENV=development pnpm run start:persistent'

.PHONY: run-dev-env-persistent-logged
run-dev-env-persistent-logged: ## Run persistent dev-env with logging
	@$(MAKE) sync-local-dev-service
	bash -lc 'set -a; [ -f ".env" ] && . ".env"; [ -f ".env.local" ] && . ".env.local"; [ -f ".env.shared-demo" ] && . ".env.shared-demo"; [ -f ".env.shared-demo.local" ] && . ".env.shared-demo.local"; set +a; export DEV_ENV_PERSISTENT=true; export DEV_ENV_PLC_DB_POSTGRES_URL="$${DEV_ENV_PLC_DB_POSTGRES_URL:-$${DB_POSTGRES_URL:-}}"; export NVM_DIR="$$HOME/.nvm"; [ -s "$$NVM_DIR/nvm.sh" ] || { echo "nvm not found at $$NVM_DIR/nvm.sh"; exit 1; }; . "$$NVM_DIR/nvm.sh"; nvm use $(NODE_VERSION) >/dev/null; cd packages/dev-env; LOG_ENABLED=true NODE_ENV=development pnpm run start:persistent | pnpm exec pino-pretty'

.PHONY: sync-indigo-para-lexicons
sync-indigo-para-lexicons: ## Copy com.para lexicons into indigo-main for Go lexgen
	mkdir -p indigo-main/lexicons/com/para
	find indigo-main/lexicons/com/para -type f -delete
	cp -R lexicons/com/para/. indigo-main/lexicons/com/para/

.PHONY: lexgen-indigo
lexgen-indigo: sync-indigo-para-lexicons ## Generate Indigo Go API types (including com.para)
	cd indigo-main && make lexgen

.PHONY: build-indigo
build-indigo: ## Build Indigo binaries
	cd indigo-main && make build

.PHONY: test-indigo
test-indigo: ## Run Indigo Go tests
	cd indigo-main && make test

.PHONY: run-indigo-relay
run-indigo-relay: ## Run Indigo relay locally
	cd indigo-main && make run-dev-relay

.PHONY: run-indigo-tap-para
run-indigo-tap-para: ## Run Indigo tap filtered for Para collections against local relay+PLC
	cd indigo-main && TAP_RELAY_URL=http://localhost:2470 TAP_PLC_URL=http://localhost:2582 TAP_SIGNAL_COLLECTION=com.para.post TAP_COLLECTION_FILTERS=com.para.post,com.para.status,com.para.social.postMeta go run ./cmd/tap run --disable-acks=true

.PHONY: codegen
codegen: ## Re-generate packages from lexicon/ files
	pnpm codegen

.PHONY: lint
lint: ## Run style checks and verify syntax
	pnpm verify

.PHONY: fmt
fmt: ## Run syntax re-formatting
	pnpm format

.PHONY: fmt-lexicons
fmt-lexicons: ## Run syntax re-formatting, just on .json files
	pnpm exec eslint ./lexicons/ --ext .json --fix

.PHONY: deps
deps: ## Installs dependent libs using 'pnpm install'
	pnpm install --frozen-lockfile

.PHONY: clean
clean: ## Deletes all 'dist' and 'node_package' directories (including nested)
	rm -rf **/dist **/node_packages

.PHONY: nvm-setup
nvm-setup: ## Use NVM to install and activate node+pnpm
	bash -lc 'export NVM_DIR="$$HOME/.nvm"; [ -s "$$NVM_DIR/nvm.sh" ] || { echo "nvm not found at $$NVM_DIR/nvm.sh"; exit 1; }; . "$$NVM_DIR/nvm.sh"; nvm install $(NODE_VERSION); nvm use $(NODE_VERSION); corepack enable'
