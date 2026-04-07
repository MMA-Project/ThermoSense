SHELL := /bin/bash

ENV_FILE := .env

-include $(ENV_FILE)
export

POSTGRES_DB ?= thermosense
POSTGRES_USER ?= thermosense
POSTGRES_PASSWORD ?= thermosense
DB_PORT ?= 5432
DATABASE_URL ?= postgresql://$(POSTGRES_USER):$(POSTGRES_PASSWORD)@localhost:$(DB_PORT)/$(POSTGRES_DB)?schema=public
MIGRATION_NAME ?= init

.PHONY: init env generate db-up db-down db-logs app migrate reset up down

env:
	@if [ ! -s $(ENV_FILE) ]; then cp .env.example $(ENV_FILE); fi

init: env
	npm install
	npm run generate:models
	npm run prisma:generate

generate:
	npm run generate:models

db-up:
	docker compose --env-file $(ENV_FILE) up -d db

db-down:
	docker compose --env-file $(ENV_FILE) stop db

db-logs:
	docker compose --env-file $(ENV_FILE) logs -f db

app: env
	set -a; source $(ENV_FILE); set +a; npm run dev

migrate: env db-up
	set -a; source $(ENV_FILE); set +a; npm run prisma:migrate -- --name $(MIGRATION_NAME)

reset: env db-up
	set -a; source $(ENV_FILE); set +a; npx prisma db push --force-reset
	set -a; source $(ENV_FILE); set +a; npm run prisma:seed

up: db-up app

down:
	docker compose --env-file $(ENV_FILE) down
