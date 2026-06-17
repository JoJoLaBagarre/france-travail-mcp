<!--
Merci pour votre contribution au serveur MCP France Travail !
Remplissez chaque section ci-dessous. Les lignes entre chevrons (comme celle-ci)
sont des aides : elles ne s'affichent pas dans la pull request, vous pouvez les laisser.
-->

## Description

<!--
Décrivez QUOI change et POURQUOI. Quel problème cette PR résout-elle ?
Restez factuel : comportement avant / après, choix d'implémentation notables.
-->

## Issue liée

<!--
Reliez l'issue concernée pour qu'elle se ferme automatiquement à la fusion.
Exemple : Fixes #123
Si aucune issue n'existe, indiquez simplement le contexte.
-->

Fixes #

## Type de changement

<!-- Cochez la ou les cases correspondantes en remplaçant [ ] par [x]. -->

- [ ] Correction de bug
- [ ] Amélioration
- [ ] Nouvelle fonctionnalité
- [ ] Documentation
- [ ] Autre

## Comment cela a été testé

<!--
Décrivez les vérifications réalisées pour valider ce changement.
Citez les commandes lancées et leur résultat.
-->

- [ ] `npm test` (tests unitaires)
- [ ] `npm run smoke` avec des identifiants France Travail valides (appels réels aux API)
- [ ] Testé depuis un client MCP (ex. Claude Desktop, Inspector MCP)

## Checklist

<!-- Toutes les cases pertinentes doivent être cochées avant la relecture. -->

- [ ] La CI passe en local (`npm test`).
- [ ] Le changement respecte l'architecture : un outil = un `server.registerTool` dans `src/tools/<domaine>.ts`, en passant par `apiRequest` et `handleApiError`.
- [ ] Aucun secret en dur dans le code ; les logs partent sur `stderr` uniquement (jamais sur `stdout`, réservé au protocole MCP).
- [ ] La description de chaque outil est claire et explique quand l'utiliser.
- [ ] Le scope OAuth est documenté si une nouvelle API France Travail est utilisée.
- [ ] Le README / INSTALL est mis à jour si l'usage change.
- [ ] J'ai cherché les doublons (outil, paramètre ou logique déjà existants).

> Note : une modification fusionnée n'atteint les utilisateurs qu'après publication (`npm version` puis `git push --follow-tags`). Tant que ce n'est pas publié, le changement reste invisible côté `npx`.
