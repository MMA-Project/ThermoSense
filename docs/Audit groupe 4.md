# **Audit croisé — Contrat OpenAPI**

**Groupe auditeur :** Groupe 2 (Samuel Léobon, Eliot Louys, Mattis Naud, Alexandre Clenet, Melvin Simon)  
**Contrat audité :** Groupe 4

## Tableau d'évaluation

| Critère | Évaluation | Commentaire factuel (1-2 lignes max) |
| ----- | :---: | ----- |
| **Critère 1 : Endpoint testable sans lire le code** Peut-on construire une requête valide sur au moins un endpoint en lisant uniquement le contrat ? | **Oui** | Le contrat définit clairement les URL, méthodes, paramètres de chemin, schémas de corps avec exemples et le schéma d'authentification Bearer. |
| **Critère 2 : Erreurs 4xx et 5xx documentées** Les réponses d'erreur sont-elles décrites (code HTTP, corps de réponse, signification) ? | **Oui** | Erreurs (400, 401, 404, 503\) systématiquement documentées avec un schéma Errors structuré (code, message, details). |
| **Critère 3 : Stratégie de versioning visible** Peut-on identifier la version de l'API et comprendre la stratégie adoptée ? | **Oui** | Versioning visible dans l'URL des serveurs cibles (/v1) et spécifié dans les métadonnées (version: "1.0.0"). |
| **Critère 4 : Exemples présents** Y a-t-il des exemples de requête et/ou de réponse dans le contrat ? | **Oui** | Exemples explicites présents au niveau des propriétés pour tous les schémas de requêtes et de réponses. |
| **Critère 5 : Cohérence des schémas** Les types, formats et contraintes (required, type, format, enum) sont-ils définis de façon cohérente ? | **Oui** | Schémas présents et complets, incluant formats (date-time, float), énumérations et contraintes de validation (minLength, maximum). |
| **Critère 6 : README opérationnel** Le README permet-il de démarrer le projet sans contacter l'équipe ? | **Oui** | Fichier README fourni et contenant les instructions nécessaires pour démarrer l’API. |
| **Critère 7 : Cohérence endpoints / ressources** Les endpoints exposés forment-ils un ensemble cohérent ? (nommage uniforme, logique REST) | **Oui** | Hiérarchie REST respectée (ex: /buildings/{id}/zones) et l'usage des verbes HTTP est sémantiquement correct. |
| **Critère 8 : Sécurité visible dans le contrat** Les endpoints sensibles documentent-ils l'authentification requise ? | **Oui** | Sécurité globale bearerAuth définie et explicitement désactivée (security: \[\]) sur les routes publiques /health et /auth/login. |

## Synthèse pour la restitution orale

### Point fort identifié

**Constat :** Très bonne structuration des schémas de données. L'utilisation systématique des contraintes de validation (ex: `minimum: -90`, `maxLength: 100`) et des énumérations strictes garantit un haut niveau de fiabilité pour la validation des entrées.

### Incohérence

**Constat :** Absence totale de paramètres de pagination ou de filtrage sur les endpoints retournant des collections (ex: `GET /buildings/{buildingId}/zones/{zoneId}/sensors/{sensorId}/measurements`). Cela expose l'API à un risque de surconsommation de ressources (API4:2023) si l'historique des mesures est volumineux.

### Question ouverte

**Question :** Comment protégez-vous la base de données et la bande passante lors de l'appel à `GET /.../measurements` si un capteur possède plusieurs dizaines de milliers d'enregistrements historiques, sachant qu'aucune pagination n'est définie dans le contrat ?  
