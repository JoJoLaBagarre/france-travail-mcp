# 🔌 Installation — France Travail MCP

Choisis ton assistant IA ci-dessous. **Une fois le paquet publié sur npm** (voir §0), chaque
installation tient en **une ligne** (`npx -y france-travail-mcp`).

> 🧩 Prérequis communs : des **identifiants France Travail** (`FT_CLIENT_ID` / `FT_CLIENT_SECRET`).
> Pour les obtenir : crée un compte sur [francetravail.io](https://francetravail.io), crée une
> application, souscris aux API (Offres d'emploi v2, ROME 4.0, ROMEO 2…), récupère le Client ID
> et le Client Secret. **Node.js ≥ 18** est requis sauf pour l'option `.mcpb` ci-dessous (autoportée).

---

## 🖱️ Le plus simple : bundle `.mcpb` (Claude Desktop, zéro terminal)

Idéal si tu n'es pas développeur :

1. Télécharge **`france-travail-mcp.mcpb`** depuis la [page Releases](https://github.com/jojolabagarre/france-travail-mcp/releases).
2. **Double-clique** le fichier : Claude Desktop l'installe et affiche un **formulaire** pour saisir
   ton `Client ID` et ton `Client Secret` (le secret est stocké dans le trousseau de l'OS).
3. Terminé — pas de JSON à éditer, pas de Node.js à installer.

> 🛠️ *Mainteneur* : ce bundle se génère avec `npm run bundle` (produit `france-travail-mcp.mcpb`).

---

## 0. (Une seule fois) Publier sur npm pour activer le `npx`

```bash
# vérifier que le nom est libre
npm view france-travail-mcp   # doit répondre "404 Not Found"
# se connecter puis publier
npm login
npm publish --access public
```

> 💡 Le `.env` (tes vrais identifiants) **n'est pas** inclus dans le paquet npm (liste blanche
> `files` dans `package.json`). Pense quand même à régénérer ton `client_secret` avant toute étape publique.

**Pas encore publié ?** Remplace partout `npx -y france-travail-mcp` par le chemin local :
`node "C:\\Users\\User\\logiciel_claude\\git_france_travail\\dist\\index.js"` (après `npm run build`).
Dans ce cas, les identifiants sont lus automatiquement depuis le fichier `.env` du projet — pas
besoin de bloc `env`.

---

## ⌨️ Claude Code (CLI) — la plus rapide, vraiment 1 ligne

```bash
claude mcp add france-travail \
  -e FT_CLIENT_ID=PAR_xxxxx \
  -e FT_CLIENT_SECRET=ton_secret \
  -- npx -y france-travail-mcp
```

## 🖥️ Claude Desktop

Édite `%APPDATA%\Claude\claude_desktop_config.json` (Windows) puis redémarre l'app :

```json
{
  "mcpServers": {
    "france-travail": {
      "command": "npx",
      "args": ["-y", "france-travail-mcp"],
      "env": { "FT_CLIENT_ID": "PAR_xxxxx", "FT_CLIENT_SECRET": "ton_secret" }
    }
  }
}
```

## 🖱️ Cursor

Édite `~/.cursor/mcp.json` (ou `.cursor/mcp.json` dans le projet) — **même format que Claude Desktop**.

## 🧩 VS Code — Cline / Continue / Copilot

Dans le fichier de config MCP de l'extension (ex. *Cline* → `cline_mcp_settings.json`), ajoute le
**même bloc `mcpServers`** que ci-dessus.

---

## 🦙 Ollama — assistants 100 % LOCAUX

Ollama est un **moteur de LLM local**, pas un client MCP. Pour brancher ce serveur dessus, il faut
un **hôte MCP** qui utilise Ollama comme modèle. Deux options simples :

> ⚠️ Le modèle Ollama doit **savoir appeler des outils** (function calling). Modèles recommandés :
> `qwen2.5`, `llama3.1`, `mistral-nemo`, `qwen2.5-coder`. (`ollama pull qwen2.5`)

### Option A — `mcphost` (ligne de commande, le plus simple)

```bash
# 1. installer mcphost (nécessite Go) ou télécharger un binaire depuis son dépôt GitHub
go install github.com/mark3labs/mcphost@latest

# 2. créer un fichier mcp.json
#    { "mcpServers": { "france-travail": {
#        "command": "npx", "args": ["-y", "france-travail-mcp"],
#        "env": { "FT_CLIENT_ID": "PAR_xxxxx", "FT_CLIENT_SECRET": "ton_secret" } } } }

# 3. lancer un chat local qui peut utiliser les outils France Travail
mcphost -m ollama:qwen2.5 --config mcp.json
```

### Option B — Open WebUI + `mcpo` (interface web)

`mcpo` expose le serveur MCP comme une API OpenAPI qu'Open WebUI sait appeler :

```bash
# expose le serveur sur http://localhost:8000
FT_CLIENT_ID=PAR_xxxxx FT_CLIENT_SECRET=ton_secret \
  uvx mcpo --port 8000 -- npx -y france-travail-mcp
```
Puis dans **Open WebUI** → *Settings → Tools → Add Connection* → `http://localhost:8000`.
Tes modèles Ollama peuvent désormais chercher des offres, deviner des codes ROME, etc.

### Autres clients locaux compatibles MCP + Ollama
**LibreChat**, **oterm**, **5ire**, **Witsy** — tous acceptent un bloc `mcpServers` au même format.

---

## ✅ Vérifier que ça marche

Une fois branché, demande à ton assistant :

- *« Trouve-moi des offres de boulanger en CDI autour de Lyon. »*
- *« Je répare des vélos — quel est le code ROME et quelles offres près de Paris ? »*

Ou lance le test automatique fourni : `node scripts/smoke.mjs` (après `npm run build`).
