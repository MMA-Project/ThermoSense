# **Résilience mobile/IoT et mesures réseau dégradé**

## Plan de test réseau dégradé

### Endpoint critique ciblé

**Méthode HTTP \+ URI :** /actuator/\[id\] \- PATCH (active un actionneur)  
**Justification du choix :** cet endpoint est critique car il affecte l’action physique d’un actionneur. C'est-à-dire que cela aura un impact sur le monde réel si l’endpoint ne fonctionne pas correctement.

### Outil de simulation et configuration

**Outil utilisé :** Postman  
**Configuration exacte (Reproductible) :**

\# Insérer ici les commandes exactes ou le fichier de configuration

### Scénarios de simulation chiffrés

**Scénario 1 : Réseau très instable (chantier/entrepôt)** 

* **Paramètres chiffrés :** latence 800–1500 ms, 20% taux de perte  
* **Justification terrain :**

**Scénario 2 : Panne partielle (passerelle IoT saturée)**

* **Paramètres chiffrés :** latence 2000–4000 ms, 50% taux de perte  
* **Justification terrain :**

### Métriques collectées et critères de succès/échec

**Métriques suivies :** Taux de succès (%), Latence perçue p95 (ms), Retries par requête, Doublons observés, Consommation réseau (req/min).

**Critères de succès/échec :**

* *Succès :* Taux de succès \> 90%   
* *Échec :* Taux de succès \< 90%

## Mesures avant/après

### Tableau comparatif des mesures

| Métrique | Baseline (Sans résilience) | Après mécanismes | Delta | Scénario de référence |
| :---- | :---: | :---: | :---: | :---- |
| **Taux de succès (%)** | 42.5% | 94.80% | \+52.30% | Scénario 2 |
| **p95 latence perçue (ms)** | 1450ms | 3100ms | \+1650ms | Scénario 2 |
| **Retries / requête** | 0 | 1.15 | \+1.15 | Scénario 2 |
| **Doublons observés** | 3 | 0 | \-3 | Scénario 2 |
| **Consommation réseau (req/min)** | 8 | 18 | \+10 req/min | Scénario 2 |

### Interprétation des deltas

La consommation réseau et la latence moyenne perçue augmentent de manière notable, ce qui est expliqué par le mécanisme de retry implémenté qui provoque ça. Cependant, on a en retour un taux de succès très largement supérieur, ayant doublé et approchant les 95%.

## Mécanismes retenus et écartés

### Mécanismes de résilience retenus

#### Mécanisme 1 : Idempotency Key

**Paramètres retenus :** header `Idempotency Key`  
**Justification :** appliquer plusieurs fois d’affilée la même requête sur un actionneur peut avoir un impact critique sur l’environnement réel.

#### Mécanisme 2 : Retry \+ backoff

**Paramètres retenus :** maximum 5 retries, backoff de 500ms  
**Justification :** on part du principe que l’activation d’un actionneur a une certaine importance qui nécessite un nombre de retry plutôt large pour assurer que ça passe, ainsi qu’un backoff linéaire pour éviter les délais trop longs.   
**Compromis :** consommation réseau et latence accrues si les requêtes échouent

### Mécanisme écarté

**Mécanisme non retenu :** circuit breaker  
**Raison de l'exclusion :** c’est inadapté à l’endpoint \- appliquer un circuit breaker ici empêcherait tout ajustement de l’actionneur, ou réversion d’un comportement incorrect en cas d’erreur.

### Volet Sécurité et gestion des effets de bord

**Analyse du risque de double exécution :** combinaison Idempotency Key et ETag pour garantir que chaque requête ne s’exécute qu’une seule fois.  
