# 🛠️ Guide du mainteneur — répondre aux issues & gérer les PR

Ce dépôt est protégé : **toute modification de `main` passe par une Pull Request que _tu_ dois approuver**, avec la CI verte. Tu as le dernier mot. Voici comment gérer ce qui arrive.

---

## 📥 Partie 1 — Répondre à une issue

### 1. Trier (idéalement sous 48 h)
Quand une issue arrive, 3 questions :
- **Est-ce clair ?** Sinon, demande des précisions.
- **C'est quoi ?** Un **bug**, une **demande de fonctionnalité**, ou une **question** ?
- **Reproductible ?** (pour un bug)

Pose un **label** : `bug`, `enhancement` (fonctionnalité), `question`, `documentation`, `good first issue`, `wontfix`, `duplicate`.

### 2. Réponses types (à copier-coller, à adapter)

**🐛 Bug — il manque des infos :**
> Merci pour le signalement ! Pour que je puisse reproduire, peux-tu préciser :
> - la **version** utilisée (paquet npm, ou nom du fichier `.mcpb`)
> - le **client** (Claude Desktop, Claude Code, Cursor…)
> - l'**outil** concerné (`ft_search_offres`, etc.) et les **paramètres** envoyés
> - le **message d'erreur** complet
>
> Merci 🙏

**✅ Bug confirmé :**
> Bien vu, je reproduis — c'est un bug côté [X]. Je corrige et je publie un patch (0.1.x). Je te tiens au courant ici.

**💡 Demande de fonctionnalité — intéressante :**
> Bonne idée ! Je l'ajoute à la feuille de route. Si tu veux tenter une PR, l'archi est expliquée dans [CONTRIBUTING.md](CONTRIBUTING.md). Sinon je regarderai dès que possible.

**🚫 Hors-scope (refus poli) :**
> Merci pour la proposition ! Je préfère garder ce serveur centré sur les **API officielles France Travail**, donc je ne vais pas intégrer [X] pour l'instant. Je laisse l'issue ouverte si d'autres veulent en discuter.

**❓ Question (pas un bug) :**
> [réponse]. Je referme l'issue, mais rouvre-la sans souci si besoin !

### 3. Clore
- Une issue se ferme **automatiquement** si la PR (ou le commit) qui la corrige contient `Fixes #123` dans son titre/description.
- Sinon, ferme-la à la main avec un mot : *« corrigé en 0.1.2, merci ! »*.

---

## 🔀 Partie 2 — Gérer une Pull Request (ajout de fonctionnalité)

> Rappel : une PR ne peut être mergée que si **(1) la CI `build` est verte** et **(2) tu l'as approuvée**. Personne ne peut passer outre à part toi.

### 1. À l'arrivée de la PR
- GitHub te notifie → ouvre l'onglet **« Files changed »**.
- Regarde d'abord le **check CI** en bas de la PR : s'il est **rouge**, demande à l'auteur de le faire passer avant d'aller plus loin.

### 2. Checklist de review (spécifique à ce repo)
- [ ] **CI verte** (`build` / `tsc` compile sans erreur)
- [ ] **Respect de l'architecture** : un nouvel outil = un `server.registerTool(...)` dans le bon fichier `src/tools/<domaine>.ts`
- [ ] Les appels API passent par **`apiRequest`**, les erreurs par **`handleApiError`** (pas de `fetch`/`axios` en direct)
- [ ] **Aucun secret en dur** ; **aucun `console.log` sur stdout** (les logs vont sur stderr via `console.error`)
- [ ] **Description de l'outil claire** — c'est le texte que l'IA lit pour décider de l'utiliser
- [ ] Si **nouvelle API** : le **scope OAuth** est documenté dans le tableau du [README](README.md)
- [ ] **README / INSTALL** mis à jour si l'usage change
- [ ] **Testé** : idéalement `npm run smoke` passe (ou l'auteur fournit une preuve d'exécution)

### 3. Demander des changements
Onglet **« Files changed » → « Review changes » → « Request changes »**, avec un retour constructif :
> Merci pour la PR, bon début ! Deux points avant merge :
> 1. Peux-tu déplacer l'outil dans `src/tools/…` pour suivre l'archi ?
> 2. La description de l'outil gagnerait à préciser […].
>
> Le reste me va 👍

### 4. Approuver & merger
1. **« Review changes » → « Approve ».**
2. Bouton de merge : choisis **« Squash and merge »** (1 commit propre par fonctionnalité).
3. **Remercie** l'auteur — c'est ce qui fait revenir les contributeurs. 🙏

### 5. ⚠️ Important — livrer la maj aux utilisateurs
**Une PR mergée n'est PAS encore chez les utilisateurs.** Pour la publier :
```bash
npm version patch      # patch = correction · minor = ajout compatible · major = cassant
git push --follow-tags
```
→ le workflow publie sur **npm + registre MCP**. Les utilisateurs `npx` reçoivent la maj au prochain démarrage de leur client.
*(Pense à régénérer le `.mcpb` et à l'attacher à la nouvelle Release pour les utilisateurs Claude Desktop.)*

### Refuser une PR, poliment
> Merci d'avoir pris le temps ! Je ne vais pas merger celle-ci ([raison : hors-scope / doublon de #X / approche différente]), mais j'apprécie vraiment le geste. N'hésite pas pour d'autres idées 🙌

---

## 🧭 Aide-mémoire express

| Situation | Action |
|---|---|
| Issue floue | Demander version + client + outil + erreur |
| Bug confirmé | Label `bug`, corriger, `npm version patch`, tag |
| Idée de fonctionnalité | Label `enhancement`, orienter vers `CONTRIBUTING.md` |
| PR reçue | Vérifier **CI verte** → review → **Approve** → **Squash & merge** |
| Après un merge | `npm version … && git push --follow-tags` pour livrer |
| Hors-scope | Refuser poliment, garder le projet focalisé |

> 💡 Des **templates d'issue et de PR** préremplis font gagner du temps des deux côtés (et t'évitent de réclamer les infos manquantes). Ils ne sont pas encore en place — voir la proposition en bas du README ou demande au mainteneur de les ajouter dans `.github/`.
