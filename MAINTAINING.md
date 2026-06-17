# Guide du mainteneur — répondre aux issues & gérer les PR

Ce dépôt est protégé : **toute modification de `main` passe par une Pull Request qui exige (1) la CI `build` verte et (2) _ton_ approbation**. Personne ne peut passer outre, pas même toi en `push` direct. Tu as le dernier mot.

Les issues n'arrivent plus en texte libre : elles passent par des **formulaires structurés** (`.github/ISSUE_TEMPLATE/`). Tu reçois donc déjà, en clair, la **version**, le **client**, l'**outil concerné**, les **étapes de reproduction** et le **message d'erreur**. Ton travail de tri en est largement allégé — concentre-toi sur la qualification et la réponse.

---

## Partie 1 — Répondre à une issue

### 1. Trier (idéalement sous 48 h)

Les formulaires posent déjà un label de départ (`bug` ou `enhancement`) et le label `triage`. À l'ouverture, tu fais trois choses :

1. **Vérifier que les champs obligatoires sont remplis.** Si le formulaire a été contourné (issue vide, gabarit ignoré), réclame les infos manquantes avec la réponse type ci-dessous.
2. **Confirmer ou corriger la qualification** : est-ce vraiment un **bug**, une **demande de fonctionnalité** (`enhancement`), ou plutôt une **question** ? Repose le bon label en conséquence.
3. **Retirer `triage`** dès que l'issue est qualifiée — c'est ce label qui distingue « pas encore regardé » de « pris en charge ».

Labels de référence : `bug`, `enhancement`, `question`, `documentation`, `good first issue`, `triage`, `wontfix`, `duplicate`.

### 2. Réponses types (à copier-coller, à adapter)

**Bug — formulaire incomplet / infos manquantes :**
> Merci pour le signalement ! Il me manque quelques éléments pour reproduire. Peux-tu compléter :
> - la **version** utilisée (paquet npm `france-travail-mcp@x.y.z`, ou nom du fichier `.mcpb`)
> - le **client** (Claude Desktop, Claude Code, Cursor…)
> - l'**outil** concerné (`ft_search_offres`, `ft_predict_rome`, `ft_list_referentiel`…) et les **paramètres** envoyés
> - les **étapes** exactes et le **message d'erreur** complet
>
> Le plus simple est de rouvrir une issue via le formulaire « Signaler un bug », qui pose toutes ces questions. Merci !

**Bug — confirmé :**
> Bien vu, je reproduis — c'est un bug côté [`apiRequest` / `handleApiError` / outil `ft_…` / schéma]. Je corrige et je publie un patch (0.1.x). Je te tiens au courant ici, l'issue se fermera automatiquement au merge.

**Demande de fonctionnalité — intéressante :**
> Bonne idée, merci ! Je passe ça en `enhancement` et je l'ajoute à la feuille de route. Si tu veux tenter une PR, l'archi (`src/tools/<domaine>.ts`, `apiRequest`, `handleApiError`) est décrite dans [CONTRIBUTING.md](CONTRIBUTING.md). Sinon je regarderai dès que possible.

**Hors-scope — refus poli :**
> Merci pour la proposition ! Je préfère garder ce serveur strictement centré sur les **API officielles France Travail** (offres, ROME 4.0, ROMEO, La Bonne Boîte). Je ne vais donc pas intégrer [X] pour l'instant. Je laisse l'issue ouverte si d'autres veulent en discuter, mais je la passe en `wontfix`.

**Question — pas un bug :**
> [réponse claire]. Je referme l'issue puisqu'il ne s'agit pas d'un bug, mais rouvre-la sans souci si quelque chose reste flou !

### 3. Clore une issue

- **Automatiquement** : une issue se ferme toute seule si la PR (ou le commit) qui la corrige contient **`Fixes #123`** (ou `Closes #123`) dans son titre ou sa description. C'est la méthode à privilégier — elle relie proprement l'issue au correctif.
- **À la main** : sinon, ferme-la avec un mot de contexte, par ex. *« corrigé en 0.1.3, merci ! »*, en pensant à préciser la **version** qui embarque le correctif.

---

## Partie 2 — Gérer une Pull Request

> **Règle de protection de branche** : une PR ne peut être mergée que si **(1) le check CI `build` est vert** _et_ **(2) tu as cliqué « Approve »**. Les deux sont **obligatoires** et non contournables.

### 1. À l'arrivée de la PR

- GitHub te notifie → ouvre l'onglet **« Files changed »**.
- Regarde d'abord le **check `build`** en bas de la PR. S'il est **rouge** (`tsc` ne compile pas, `npm test` échoue), demande à l'auteur de le faire passer **avant** d'investir du temps en review.

### 2. Checklist de review (spécifique à ce repo)

- [ ] **Check `build` vert** (`npm ci` puis `npm test` = `tsc --noEmit` sans erreur).
- [ ] **Architecture respectée** : un nouvel outil = un `server.registerTool(...)` dans le bon fichier `src/tools/<domaine>.ts` (jamais tout dans `index.ts`).
- [ ] **Couche HTTP mutualisée** : les appels API passent par **`apiRequest`** (`src/services/client.ts`), et **toutes** les erreurs sont traduites par **`handleApiError`** (`src/services/errors.ts`) — pas de `axios.request` / `fetch` en direct dans un outil.
- [ ] **Aucun secret en dur** (pas de `FT_CLIENT_ID` / `FT_CLIENT_SECRET` ni de token dans le code ou les tests).
- [ ] **Discipline stdio** : `stdout` est réservé au protocole JSON-RPC. Aucun `console.log` ; tout diagnostic passe par **`console.error` (stderr)**. Un seul `console.log` parasite casse le client.
- [ ] **Description d'outil claire** : c'est le texte que l'IA lit pour décider d'appeler l'outil. Elle doit expliciter le rôle, les paramètres clés et les pièges (codes ROME, codes INSEE, arrondissements Paris/Lyon/Marseille…).
- [ ] **Scope OAuth** : si la PR touche une **nouvelle API**, le `scope` est bien déclaré (constante `SCOPES`, `src/constants.ts`) et **documenté** dans le tableau des API/scopes du [README](README.md).
- [ ] **Doc à jour** : [README.md](README.md) et [INSTALL.md](INSTALL.md) mis à jour si l'usage, les outils ou l'installation changent.
- [ ] **Preuve d'exécution** : idéalement **`npm run smoke`** passe (test de bout en bout contre l'API réelle), ou l'auteur joint une trace d'exécution.

### 3. Demander des changements

Onglet **« Files changed » → « Review changes » → « Request changes »**, avec un retour constructif et précis :

> Merci pour la PR, bon début ! Deux points avant merge :
> 1. L'appel API passe par `axios` en direct — peux-tu le router via `apiRequest` et envelopper l'erreur avec `handleApiError` ?
> 2. La description de l'outil gagnerait à préciser le format attendu du paramètre […].
>
> Le reste me va, merci !

### 4. Approuver & merger

1. **« Review changes » → « Approve »** (rappel : c'est obligatoire, le merge reste bloqué sans ça).
2. Bouton de merge : choisis **« Squash and merge »** — un seul commit propre par fonctionnalité, historique `main` lisible.
3. Vérifie que le message de squash contient bien **`Fixes #…`** si la PR clôt une issue.
4. **Remercie** l'auteur. C'est ce qui fait revenir les contributeurs.

### 5. IMPORTANT — merger n'est PAS livrer

**Une PR mergée n'est pas encore chez les utilisateurs.** Tant que tu ne taggues pas une version, personne ne reçoit le correctif. Pour livrer :

```bash
npm version patch      # patch = correction · minor = ajout compatible · major = changement cassant
git push --follow-tags # pousse le commit ET le tag v0.1.x
```

Le tag `v*` déclenche le workflow [`publish-mcp.yml`](.github/workflows/publish-mcp.yml), qui **publie sur npm** (avec provenance) **puis sur le registre MCP officiel**. Les utilisateurs `npx` reçoivent la maj au prochain démarrage de leur client.

Puis, pour les utilisateurs **Claude Desktop** (installation par bundle) :

```bash
npm run bundle         # régénère france-travail-mcp.mcpb
```

→ attache le `.mcpb` régénéré à la **Release GitHub** correspondant au tag. Ces utilisateurs ne passent pas par npm : sans `.mcpb` à jour, ils restent sur l'ancienne version.

### Refuser une PR, poliment

> Merci d'avoir pris le temps ! Je ne vais pas merger celle-ci ([raison : hors-scope / doublon de #X / approche différente]), mais j'apprécie vraiment le geste. N'hésite pas pour d'autres idées !

---

## Aide-mémoire express

| Situation | Action |
|---|---|
| Issue via formulaire | Vérifier les champs (version/client/outil/étapes/erreur déjà fournis), corriger le label, retirer `triage` |
| Formulaire contourné / infos manquantes | Réclamer version + client + outil + étapes + erreur (réponse type) |
| Bug confirmé | Label `bug`, corriger, livrer via `npm version patch` + tag |
| Demande de fonctionnalité | Label `enhancement`, orienter vers `CONTRIBUTING.md` |
| Question | Répondre, fermer l'issue (rouvrable) |
| Hors-scope | Refuser poliment, label `wontfix`, garder le projet focalisé |
| PR reçue | Check **`build` vert** → review (archi, `apiRequest`/`handleApiError`, stderr, scope, doc) → **Approve** (obligatoire) → **Squash and merge** |
| Clôture liée | `Fixes #123` dans le squash, sinon fermer à la main en citant la version |
| Après un merge (livrer) | `npm version <patch\|minor\|major>` + `git push --follow-tags` (npm + registre MCP) |
| Pour Claude Desktop | `npm run bundle` + attacher le `.mcpb` à la Release |
