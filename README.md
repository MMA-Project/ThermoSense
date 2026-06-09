# ThermoSense

ThermoSense est une API REST Node.js/Express pour piloter et suivre un systeme de gestion thermique: zones, capteurs, mesures, actionneurs, seuils d'alerte et utilisateurs.

La source de verite fonctionnelle est le code Express dans `src/routes/api.routes.ts`. Le fichier `openapi.yml` sert de base a Swagger UI et a la generation des types TypeScript.

## Stack

- Node.js, Express 5, TypeScript
- PostgreSQL 16 via Docker Compose
- Prisma ORM
- Zod pour la validation des payloads
- JWT Bearer pour l'authentification
- Swagger UI depuis `openapi.yml`
- `@hey-api/openapi-ts` pour generer les types dans `src/generated`

## Configuration

Copier les variables d'environnement:

```bash
make init
```

`make init` cree `.env` depuis `.env.example` si le fichier est absent ou vide, installe les dependances, genere les types OpenAPI et genere le client Prisma.

Variables principales:

| Variable | Defaut / exemple | Usage |
| --- | --- | --- |
| `PORT` | `3000` | Port HTTP de l'API |
| `POSTGRES_DB` | `thermosense` | Nom de la base Docker |
| `POSTGRES_USER` | `thermosense` | Utilisateur PostgreSQL |
| `POSTGRES_PASSWORD` | `thermosense` | Mot de passe PostgreSQL |
| `DB_PORT` | `5432` | Port local expose par Docker |
| `DATABASE_URL` | `postgresql://thermosense:thermosense@localhost:5432/thermosense?schema=public` | Connexion Prisma |
| `JWT_SECRET` | `your-secret-key-here` dans `.env.example` | Secret de signature JWT |

En production ou demo partagee, remplacer `JWT_SECRET` par une valeur forte et privee.

## Lancement

Demarrer PostgreSQL puis l'API en developpement:

```bash
make up
```

Cette commande lance le service `db` Docker puis `npm run dev`.

Commandes utiles:

```bash
make db-up
make db-logs
make db-down
make app
make down
```

Commandes npm equivalentes:

```bash
npm run dev
npm run build
npm run start
npm run typecheck
npm test
```

L'API ecoute par defaut sur `http://localhost:3000`.

## Base de donnees et Prisma

Appliquer une migration Prisma:

```bash
make migrate MIGRATION_NAME=nom_de_migration
```

Reinitialiser la base et relancer la seed:

```bash
make reset
```

`make reset` execute `prisma db push --force-reset`, puis `npm run prisma:seed`.

Commandes Prisma directes:

```bash
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run prisma:seed
npm run prisma:studio
```

## Seed

La seed est definie dans `prisma/seed.cjs`.

Elle supprime les donnees existantes puis cree:

- 1 batiment: `ThermoSense HQ`
- 3 zones: `Zone A`, `Zone B`, `Zone C`
- 3 utilisateurs avec mots de passe hashes
- 3 capteurs par zone: temperature, humidite, CO2
- 2 actionneurs par zone: vanne d'air et chauffage
- 3 seuils d'alerte par zone: temperature, humidite, CO2
- 48 mesures par capteur, espacees de 30 minutes
- un historique de commandes pour chaque actionneur

Comptes crees par la seed:

| Role | Email | Mot de passe | Perimetre |
| --- | --- | --- | --- |
| `admin` | `admin@thermosense.com` | `admin123` | Toutes les zones |
| `operator` | `operator.zone-a@thermosense.com` | `operator123` | Zone A |
| `reader` | `reader@thermosense.com` | `reader123` | Zone A |

## Documentation OpenAPI et Swagger

Swagger UI est servi directement depuis `openapi.yml`:

- `GET /swagger`
- `GET /swagger.json`
- `GET /openapi.yml`

Generer les modeles TypeScript HeyAPI:

```bash
npm run generate:models
```

Les types generes sont places dans `src/generated`.

Note: `openapi.yml` decrit une surface API plus large que les routes actuellement montees dans Express. Pour les routes disponibles a l'execution, se referer a la section suivante.

## Routes disponibles

Toutes les routes metier sont prefixees par `/api`.

### Authentification

| Methode | Route | Auth | Description |
| --- | --- | --- | --- |
| `POST` | `/api/auth/register` | Non | Cree un utilisateur et renvoie un JWT |
| `POST` | `/api/auth/login` | Non | Connecte un utilisateur et renvoie un JWT |
| `GET` | `/api/auth/me` | Bearer JWT | Renvoie l'utilisateur courant |

Payload register:

```json
{
  "email": "user@thermosense.com",
  "password": "password123",
  "name": "User Name",
  "role": "reader",
  "zoneIds": []
}
```

Payload login:

```json
{
  "email": "admin@thermosense.com",
  "password": "admin123"
}
```

Utiliser ensuite le token avec:

```http
Authorization: Bearer <token>
```

### Mesures

| Methode | Route | Scope requis | Etat |
| --- | --- | --- | --- |
| `GET` | `/api/measurement` | `measurement:read` | Route montee, controlee, repond actuellement `501 TODO` |

### Seuils d'alerte

| Methode | Route | Scope requis | Etat |
| --- | --- | --- | --- |
| `PATCH` | `/api/alert-threshold` | `alert-threshold:write` | Route montee, controlee, repond actuellement `501 TODO` |
| `POST` | `/api/zone/:id/alert-threshold` | `alert-threshold:write` | Route montee, controlee, repond actuellement `501 TODO` |

### Actionneurs

| Methode | Route | Scope requis | Description |
| --- | --- | --- | --- |
| `PATCH` | `/api/actuator/:id` | `actuator:write` | Modifie un actionneur accessible dans le perimetre de zones de l'utilisateur |

Payload accepte sur `PATCH /api/actuator/:id`:

```json
{
  "name": "Zone A - Chauffage",
  "zoneId": "zone_cuid",
  "type": "heater",
  "status": "active",
  "state": "on",
  "lastCommandAt": "2026-06-09T08:00:00.000Z"
}
```

Au moins un champ modifiable doit etre fourni. Si `id` est present dans le body, il doit correspondre a `:id`.

### Capteurs

| Methode | Route | Scope requis | Roles autorises | Description |
| --- | --- | --- | --- | --- |
| `DELETE` | `/api/sensor/:id` | `sensor:write` | `operator`, `admin` | Supprime un capteur accessible dans le perimetre de zones de l'utilisateur |

## Regles de securite implementees

### Authentification JWT

- Les routes protegees utilisent le middleware `protect`.
- Le token est lu dans `Authorization: Bearer <token>`.
- Les tokens generes au login/register expirent apres `15m`.
- Le payload JWT contient `userId`, `role`, `scope`, `zoneIds`, `aud` et `sub`.
- En cas de token absent ou invalide, l'API renvoie `401`.

### Autorisation par scopes et roles (BFLA)

Le middleware `authorize` controle les permissions au niveau route:

- refus `403` si le scope requis est absent;
- refus `403` si un role specifique est requis et que le role utilisateur ne correspond pas.

Scopes par defaut:

| Role | Scopes |
| --- | --- |
| `admin` | `measurement:read`, `alert-threshold:read`, `alert-threshold:write`, `actuator:read`, `actuator:write`, `sensor:read`, `sensor:write`, `zone:read`, `zone:write` |
| `operator` | `measurement:read`, `actuator:read`, `actuator:write`, `sensor:read`, `sensor:write`, `zone:read`, `alert-threshold:read` |
| autre / `reader` | `measurement:read`, `actuator:read`, `sensor:read`, `zone:read` |

### Autorisation par perimetre de zone (BOLA)

Les controles de ressource sont faits dans les services:

- `SensorService.deleteSensorById`
- `ActuatorService.patchActuatorById`

Regle appliquee:

- `admin` a acces a toutes les zones;
- les autres roles n'ont acces qu'aux ressources dont `zoneId` est present dans `req.user.zoneIds`;
- une ressource hors perimetre renvoie `404` pour eviter de reveler son existence.

### Rate limiting

Un rate limit est applique sur:

```http
PATCH /api/actuator/:id
```

Parametres:

- 10 requetes par 60 secondes;
- compteur par utilisateur authentifie (`userId`);
- fallback par IP si aucun utilisateur n'est present;
- reponse `429 Too Many Requests`;
- header `Retry-After` avec le nombre de secondes restantes.

### Journalisation securite et correlation id

Chaque requete recoit un header `x-correlation-id`:

- si un header entrant `x-correlation-id` est un UUID valide, il est reutilise;
- sinon l'API genere un UUID.

Les evenements de securite sont journalises en JSON sur `console.warn` ou `console.error` avec:

- `timestamp`
- `level`
- `event`
- `user_or_ip`
- `endpoint`
- `reason`
- `correlation_id`

Evenements couverts:

- `auth_failed`
- `access_denied`
- `rate_limited`

### Validation et protection des donnees sensibles

- Les payloads auth et actionneurs sont valides avec Zod.
- Les mots de passe sont hashes avec bcrypt avant stockage.
- Les reponses utilisateur excluent le champ `password`.
- Les suppressions Prisma en cascade sont configurees sur les relations zone/capteur/actionneur/mesure/seuil.

## Tests

Lancer les tests:

```bash
npm test
```

Tests presents:

- `src/middleware/auth.middleware.test.ts`: scenarios BFLA et BOLA nominaux/adverses
- `src/middleware/rate-limit.middleware.test.ts`: rate limit, `Retry-After` et forme des logs securite

## Organisation du projet

```text
src/
  app.ts                         # Express, JSON, CORS, Swagger, correlation id
  server.ts                      # Demarrage HTTP
  routes/api.routes.ts           # Routes /api montees
  middleware/
    auth.middleware.ts           # JWT + scopes/roles
    rate-limit.middleware.ts     # Rate limit en memoire
  lib/
    prisma.ts                    # Client Prisma
    security-logger.ts           # Logs securite + correlation id
  resources/
    */*.controller.ts
    */*.service.ts
    */*.repository.ts
    */*.model.ts
prisma/
  schema.prisma
  seed.cjs
openapi.yml
docker-compose.yml
Makefile
```
