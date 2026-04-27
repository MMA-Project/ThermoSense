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

## Contrôles d'autorisation (BFLA + BOLA)

### Décisions d'implémentation

| Question | Réponse |
| --- | --- |
| Où implémentez-vous le contrôle BFLA ? | Dans le middleware `authorize` (niveau route), avec double vérification `scope` + rôles autorisés. |
| Où implémentez-vous le contrôle BOLA ? | Dans la logique métier (`SensorService`) sur la ressource ciblée, après chargement de la zone du capteur. |
| En cas de BOLA, renvoyez-vous 403 ou 404 ? Pourquoi ? | `404` pour éviter la divulgation d'existence d'une ressource hors périmètre (anti-enumération). |
| Comment le middleware récupère-t-il l'information de zone de l'utilisateur ? | Depuis le JWT (`zoneIds`) injecté dans `req.user` par `protect`; la valeur provient du champ `User.zoneIds` en base au login/signup. |

### Scénarios couverts

- BFLA adverse : un `reader` tente `DELETE /api/sensor/:id` et est rejeté (`403`).
- BFLA nominal : un `operator` avec `sensor:write` passe la barrière fonctionnelle.
- BOLA adverse : un `operator` autorisé en écriture mais hors zone du capteur est rejeté (`404`).
- BOLA nominal : un `operator` dans la bonne zone (ou `admin`) peut supprimer (`204`).

### Preuves automatiques

Tests ajoutés :

- `src/middleware/auth.middleware.test.ts` (preuves BFLA et BOLA, nominales et adverses)

Exécution :

```bash
npm test
```

## Rate limiting (endpoint critique)

Le rate limiting est appliqué sur l'endpoint d'actionneur critique `PATCH /api/actuator/:id` via un middleware dédié.

| Paramètre | Votre choix | Justification |
| --- | --- | --- |
| Endpoint protégé | `PATCH /api/actuator/:id` | Endpoint de commande d'actionneur (impact opérationnel direct), sensible aux abus et aux rafales de requêtes. |
| Seuil (nb requêtes / fenêtre de temps) | `10 requêtes / 60 secondes` | Permet des actions légitimes rapprochées (pilotage manuel) tout en bloquant les boucles agressives et brute-force de commandes. |
| Dimension de comptage (par user, par IP, par device, global) | Par utilisateur authentifié (`userId` du JWT), avec fallback IP si non disponible | Plus pertinent que l'IP en environnement partagé/NAT ; aligne la limite avec l'identité responsable de l'action. |
| Comportement en cas de dépassement (status code, header Retry-After) | `429 Too Many Requests` + header `Retry-After` (secondes restantes) | Comportement HTTP standard, exploitable côté client pour backoff/retry contrôlé. |