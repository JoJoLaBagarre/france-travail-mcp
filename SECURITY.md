# Politique de sécurité

La sécurité de `france-travail-mcp` est prise au sérieux. Ce document explique quelles versions sont prises en charge, comment signaler une vulnérabilité de manière responsable, et quelles bonnes pratiques adopter pour protéger vos identifiants France Travail.

## Versions supportées

Seules les versions ci-dessous reçoivent des correctifs de sécurité.

| Version | Prise en charge    |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |
| < 0.1   | :x:                |

Nous vous recommandons de toujours utiliser la dernière version publiée afin de bénéficier des derniers correctifs.

## Signaler une vulnérabilité

**Merci de ne pas ouvrir d'issue publique** pour signaler une faille de sécurité. Une divulgation publique avant qu'un correctif ne soit disponible exposerait l'ensemble des utilisateurs.

Utilisez plutôt les **GitHub Security Advisories**, qui permettent un échange privé et chiffré :

1. Rendez-vous sur **[Report a vulnerability](https://github.com/JoJoLaBagarre/france-travail-mcp/security/advisories/new)**.
2. Décrivez la vulnérabilité de la manière la plus précise possible.

Pour permettre un traitement rapide, incluez dans votre signalement :

- une **description** claire de la vulnérabilité ;
- les **étapes de reproduction** détaillées (commandes, configuration, outil MCP concerné) ;
- l'**impact** potentiel (par exemple : fuite du `client_secret`, accès non autorisé aux API France Travail, exécution de code).

### Délai de réponse

Nous nous efforçons d'accuser réception de votre signalement sous **quelques jours**. Ce délai est donné à titre indicatif : ce projet open source est maintenu sur du temps disponible. Nous vous tiendrons informé de l'avancement de l'analyse et de la correction, et vous serez crédité (si vous le souhaitez) dans l'avis de sécurité publié une fois le correctif diffusé.

## Bonnes pratiques

Le serveur communique avec les API France Travail via le flux OAuth « client credentials ». Votre `client_secret` est un secret sensible : sa fuite permettrait à un tiers d'utiliser votre quota et vos accès aux API.

- **Ne committez jamais votre fichier `.env`.** Conservez vos identifiants (`FT_CLIENT_ID`, `FT_CLIENT_SECRET`) uniquement en local. Le dépôt fournit un fichier `.env.example` sans valeurs réelles : utilisez-le comme modèle et vérifiez que votre `.env` figure bien dans le `.gitignore`.
- **En cas de fuite du `client_secret`** (commit accidentel, partage par erreur, journal exposé), considérez-le comme compromis et **régénérez-le immédiatement** depuis votre espace application sur **[francetravail.io](https://francetravail.io)**. Révoquer l'ancien secret invalide tout usage frauduleux.
- **Le serveur ne journalise jamais les secrets.** Les seules sorties de diagnostic sont écrites sur la sortie d'erreur standard (`stderr`) afin de ne pas interférer avec le protocole MCP transitant sur `stdout`, et elles n'incluent jamais votre `client_id`, votre `client_secret` ni les jetons d'accès.

En appliquant ces règles, vous limitez fortement le risque d'exposition de vos identifiants France Travail.
