# 🇫🇷 France Travail MCP

[![npm version](https://img.shields.io/npm/v/france-travail-mcp.svg)](https://www.npmjs.com/package/france-travail-mcp)
[![CI](https://github.com/jojolabagarre/france-travail-mcp/actions/workflows/ci.yml/badge.svg)](https://github.com/jojolabagarre/france-travail-mcp/actions/workflows/ci.yml)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)
[![Node](https://img.shields.io/node/v/france-travail-mcp.svg)](https://nodejs.org)

> Serveur **MCP (Model Context Protocol)** pour les **API officielles de France Travail** : offres d'emploi, référentiel des métiers **ROME 4.0**, prédiction **ROMEO**, et entreprises qui recrutent (**La Bonne Boîte**).
>
> *An MCP server connecting any AI assistant (Claude, Cursor, VS Code…) to the official France Travail APIs: real-time job offers, the ROME occupational taxonomy, ROME-code prediction, and hiring-company search.*

Branchez votre assistant IA sur le marché de l'emploi français : il **cherche des offres en temps réel**, **traduit un métier en code ROME**, et **cible les entreprises qui recrutent** — directement dans la conversation.

C'est, à notre connaissance, le **premier serveur MCP basé sur les API REST officielles** de France Travail (les autres « MCP France Travail » sont des *scrapers* du site web, fragiles et non officiels).

---

## ⚡ Installation en 30 secondes

> Dans tous les cas, il vous faut des identifiants France Travail (gratuits) — voir [Obtenir vos identifiants](#-obtenir-vos-identifiants).

### 🖱️ Option A — La plus simple, sans terminal (Claude Desktop)
1. Téléchargez le fichier **`france-travail-mcp.mcpb`** depuis la [page Releases](https://github.com/jojolabagarre/france-travail-mcp/releases).
2. **Double-cliquez** dessus : Claude Desktop l'installe et vous demande votre `Client ID` / `Client Secret` dans un **formulaire** (le secret est stocké dans le trousseau de votre système).
3. C'est prêt — **aucune édition de fichier JSON**.

### ⌨️ Option B — Une ligne (Claude Code)
```bash
claude mcp add france-travail \
  -e FT_CLIENT_ID=PAR_xxxxx \
  -e FT_CLIENT_SECRET=votre_secret \
  -- npx -y france-travail-mcp
```

### 🧩 Option C — Copier-coller (Claude Desktop, Cursor, VS Code…)
```json
{
  "mcpServers": {
    "france-travail": {
      "command": "npx",
      "args": ["-y", "france-travail-mcp"],
      "env": {
        "FT_CLIENT_ID": "PAR_xxxxx_xxxxxxxxxxxxxxxxxxxx",
        "FT_CLIENT_SECRET": "votre_secret"
      }
    }
  }
}
```

📖 **Guide complet par client (Cursor, VS Code/Cline, et Ollama 100 % local) → [INSTALL.md](INSTALL.md).**

---

## 🔑 Obtenir vos identifiants

1. Créez un compte sur **[francetravail.io](https://francetravail.io)**.
2. Créez une **application** dans votre espace.
3. **Souscrivez** aux API souhaitées (au minimum *Offres d'emploi v2* ; puis *ROME 4.0 – Métiers*, *ROME 4.0 – Fiches métiers*, *ROMEO 2*, *La Bonne Boîte v2* selon les outils voulus).
4. Récupérez le **Client ID** (`PAR_…`) et le **Client Secret**.

Prérequis : **Node.js ≥ 18** (sauf l'option A, qui est autoportée).

---

## 🧰 Outils exposés

| Outil | Description | API France Travail | Statut |
|-------|-------------|--------------------|--------|
| `ft_search_offres` | Recherche multicritères d'offres (mots-clés, ROME, géo, contrat, salaire…) | Offres d'emploi v2 | ✅ testé en live |
| `ft_get_offre` | Détail complet d'une offre | Offres d'emploi v2 | ✅ testé en live |
| `ft_list_referentiel` | Référentiels (communes, types de contrats…) codes ↔ libellés | Offres d'emploi v2 | ✅ testé en live |
| `ft_search_metiers` | Trouver un métier ROME et son code par texte | ROME 4.0 – Métiers | ✅ testé en live |
| `ft_get_metier` | Fiche d'un métier ROME (définition, accès) | ROME 4.0 – Métiers | ✅ testé en live |
| `ft_get_fiche_metier` | Compétences & savoirs d'un métier | ROME 4.0 – Fiches métiers | ✅ testé en live |
| `ft_predict_rome` | Deviner le code ROME d'un intitulé libre (IA) | ROMEO 2 | ✅ testé en live |
| `ft_search_entreprises` | Entreprises à fort potentiel d'embauche | La Bonne Boîte v2 | ⚠️ désactivé par défaut |

> **La Bonne Boîte** est une API à *accès conditionné* : la simple souscription ne suffit pas, France Travail exige une **habilitation validée manuellement** (sans elle, l'API renvoie `403 Invalid scope`). L'outil `ft_search_entreprises` est donc **désactivé par défaut** ; une fois l'accès accordé, activez-le avec la variable d'environnement `FT_ENABLE_LABONNEBOITE=true` (son endpoint exact reste à confirmer).
>
> Les autres outils s'activent automatiquement dès que l'API correspondante est souscrite, **sans changement de code**.

---

## 🧪 Exemple — l'agent enchaîne les outils tout seul

> *« Je suis pâtissier et je cherche un CDI vers Lyon. »*
> 1. `ft_predict_rome("pâtissier")` → code ROME `D1104`
> 2. `ft_search_offres(codeROME=["D1104"], commune="69381", typeContrat=["CDI"])`
> 3. `ft_search_entreprises(...)` pour les candidatures spontanées.

> ⚠️ **Paris, Lyon et Marseille** s'indiquent par **arrondissement** (Lyon 1er = `69381`, Paris 1er = `75101`, Marseille 1er = `13201`) : les codes « globaux » `69123` / `75056` / `13055` sont refusés par l'API (erreur 400). Récupérez les bons codes avec `ft_list_referentiel`.

---

## 🔐 Correspondance outils ↔ scopes OAuth

Chaque API a son propre *scope*. Le serveur demande **un token par scope** (mis en cache ~25 min). Pour activer un groupe d'outils, votre application doit avoir souscrit à l'API correspondante :

| API à souscrire | Scope OAuth | Active |
|-----------------|-------------|--------|
| Offres d'emploi v2 | `api_offresdemploiv2 o2dsoffre` | `ft_search_offres`, `ft_get_offre`, `ft_list_referentiel` |
| ROME 4.0 – Métiers | `api_rome-metiersv1 nomenclatureRome` | `ft_search_metiers`, `ft_get_metier` |
| ROME 4.0 – Fiches métiers | `api_rome-fiches-metiersv1 nomenclatureRome` | `ft_get_fiche_metier` |
| ROMEO 2 | `api_romeov2` | `ft_predict_rome` |
| La Bonne Boîte v2 | `api_labonneboitev2` | `ft_search_entreprises` |

---

## 🛠️ Développement

```bash
git clone https://github.com/jojolabagarre/france-travail-mcp.git
cd france-travail-mcp
npm install              # installe les dépendances ET compile (script "prepare")
cp .env.example .env     # renseignez FT_CLIENT_ID / FT_CLIENT_SECRET
npm run smoke            # test de bout en bout contre l'API réelle
```

| Commande | Rôle |
|---|---|
| `npm run build` | Compile TypeScript → `dist/` |
| `npm test` | Vérifie les types (`tsc --noEmit`) |
| `npm run smoke` | Test de bout en bout contre l'API réelle |
| `npm start` | Démarre le serveur (transport stdio) |
| `npm run bundle` | Génère le bundle `.mcpb` (Claude Desktop) |

Stack : TypeScript · `@modelcontextprotocol/sdk` · `zod` · `axios`. Transport **stdio**.
Architecture : `src/services` (auth OAuth2 + client HTTP + erreurs), `src/schemas`, `src/tools` (un fichier par domaine). Voir [CONTRIBUTING.md](CONTRIBUTING.md).

## 📦 Publication (mainteneur)

La publication est **automatique** sur un tag de version (npm **puis** registre MCP officiel) :

```bash
npm version patch        # met à jour la version, crée le commit + le tag
git push --follow-tags   # déclenche le workflow de publication
```

Voir [`.github/workflows/publish-mcp.yml`](.github/workflows/publish-mcp.yml). Secret requis dans le dépôt : `NPM_TOKEN` (jeton npm). L'authentification au registre MCP se fait par OIDC (aucun secret supplémentaire).

## 🔒 Sécurité

- Le fichier **`.env` n'est jamais committé** (voir `.gitignore`).
- Les identifiants sont fournis au serveur via les **variables d'environnement** du client MCP (ou le formulaire sécurisé du bundle `.mcpb`).
- Ne partagez jamais votre `client_secret`. En cas de fuite, **régénérez-le** sur francetravail.io.

## 🗺️ Feuille de route

- [ ] La Bonne Alternance (offres + formations en alternance)
- [ ] Marché du travail (statistiques, tensions de recrutement par bassin)
- [ ] Validation/finalisation de `ft_search_entreprises` (La Bonne Boîte)
- [x] Publication npm + registre MCP + bundle `.mcpb`

## 🤝 Contribuer

Les contributions sont bienvenues : ouvrez une *issue* ou une *pull request*. Voir [CONTRIBUTING.md](CONTRIBUTING.md).

## 📄 Licence & avertissement

Sous licence **MIT** (voir [LICENSE](LICENSE)).

Projet **non officiel**, non affilié à France Travail. Il consomme les API publiques de France Travail ; leur usage est soumis aux conditions d'utilisation de [francetravail.io](https://francetravail.io). « France Travail », « ROME » et « La Bonne Boîte » sont des marques de France Travail.
