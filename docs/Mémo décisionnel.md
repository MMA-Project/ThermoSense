# **Mémo décisionnel \- Commission d'architecture**

## Contexte système

L’API ThermoSense est une API centrale de gestion de flux de systèmes IoT pour le suivi et la gestion thermique de différents types de bâtiments. Les consommateurs sont les systèmes IoT, l’application mobile client, l’application mobile des opérateurs terrain et l’ERP de facturation.

## Trois décisions structurantes

### Décision 1 : Stratégie de versioning de l'API 

* ### **Le choix retenu :**Versionning dans le header

* **Les options écartées :** Versionning par URL   
* **Le compromis assumé :** Pas de version claire dans l’url, mais assure une continuité dans l

### Décision 2 : Mécanisme d'idempotence sur les opérations sensibles

* **Le choix retenu :** Implémentation d'un header obligatoire Idempotency-Key   
* **Les options écartées :** Base de données avec contraintes d’unicité stricte  
* **Le compromis assumé :** Complexité accrue du middleware côté serveur, contrebalancé par la garantie absolue de non-double exécution lors d'un retry

### Décision 3 : Stratégie d'authentification et modèle d'autorisation

* **Le choix retenu :** Jetons JWT signés asymétriquement (RS256) avec claims de rôles validés côté serveur  
* **Les options écartées :** Sessions cookies, ou validation de jeton opaque via introspection opaque à chaque requête  
* **Le compromis assumé :**Impossibilité de révoquer un jeton de manière instantanée avant son expiration sans base de données de révocation (blacklisting), mais scalabilité maximale et découplage complet du serveur d'authentification.

## Un risque résiduel majeur

**Risque identifié :** Panne de la gestion thermique par les actionneurs en cas de panne réseau prolongée sur une zone géographique.  
**Quantification du risque :** Impact sur la gestion thermique pouvant créer un déséquilibre prolongé sur les zones affectées ; probabilité basse  \- impact critique  
**Justification du choix :** Ce risque est assumé à ce stade car le réseau internet est suffisamment robuste pour que d’éventuelles pannes restent brèves et gérables. La remédiation totale nécessite la mise en place de règles de retry extrêmement agressives qui impacterait négativement la charge sur l’API sur des problèmes réseau beaucoup plus mineurs.

## Un scène d'incident préparé

**Nom de l'incident :** Tentative d’exfiltration massive de données via GET /measurements  
**Description du scénario démontré :** Nous allons simuler un volume massif de requêtes GET sur /measurements dans l’idée de DDOS l’API et de récupérer en masse des données sensibles.  
**Objectif de la démonstration et comportement attendu :** Prouver la robustesse de l’API en activant le mécanisme de rate-limiting sur cet endpoint et la portée limitée des données retournées par l’appel API afin de réduire l’impact informationnel d’une fuite.   
