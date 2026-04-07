# ThermoSense

## Génération des modèles (HeyAPI)

Les modèles TypeScript sont générés depuis `openapi.yml` avec `@hey-api/openapi-ts`.

```bash
npm run generate:models
```

Les types générés sont dans `src/generated` (notamment `types.gen.ts`).

## Swagger UI depuis le YAML

La documentation Swagger est servie directement depuis `openapi.yml` sur :

- `/swagger`
- `/swagger.json` (spec JSON)
- `/openapi.yml` (spec YAML)

## Lancer DB + app (Makefile)

### Initialisation

```bash
make init
```

`make init` crée `.env` depuis `.env.example` si le fichier est absent ou vide.

### Démarrer PostgreSQL + app

```bash
make up
```

Les variables sont chargées depuis `.env`.

### Commandes utiles

```bash
make db-up
make db-logs
make migrate MIGRATION_NAME=add_actuator_command
make reset
make down
```

`make reset` réinitialise le schéma via `prisma db push --force-reset` puis relance la seed.

## Prisma (PostgreSQL)

Le schéma Prisma reste inchangé dans `prisma/schema.prisma`.

Pour générer le client Prisma :

```bash
npm run prisma:generate
```

Créer/appliquer une migration Prisma :

```bash
npm run prisma:migrate -- --name init
```

Exécuter la seed réaliste (zones, capteurs, historique de mesures, actionneurs + commandes) :

```bash
npm run prisma:seed
```

Ouvrir Prisma Studio :

```bash
npm run prisma:studio
```

Définir la variable d'environnement `DATABASE_URL` (exemple) :

```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/thermosense?schema=public"
```

## Commandes actionneurs

Nouvel endpoint de commande :

- `POST /api/actuator/{id}/command`

Exemple de payload :

```json
{ "action": "open" }
```