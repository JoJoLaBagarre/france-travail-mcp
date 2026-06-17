# Contribuer à France Travail MCP

Merci de l'intérêt porté au projet ! Les contributions — *issues*, *pull requests*, améliorations de doc — sont les bienvenues.

## Prérequis
- **Node.js ≥ 18**
- Des identifiants France Travail (`FT_CLIENT_ID` / `FT_CLIENT_SECRET`) — voir le [README](README.md#-obtenir-vos-identifiants).

## Mise en place
```bash
git clone https://github.com/jojolabagarre/france-travail-mcp.git
cd france-travail-mcp
npm install            # installe les dépendances ET compile (script "prepare")
cp .env.example .env   # renseignez vos identifiants
```

## Commandes utiles
| Commande | Rôle |
|---|---|
| `npm run build` | Compile TypeScript → `dist/` |
| `npm test` | Vérifie les types (`tsc --noEmit`) — sans réseau |
| `npm run smoke` | Test de bout en bout contre l'API réelle (nécessite `.env`) |
| `npm start` | Démarre le serveur (transport stdio) |
| `npm run bundle` | Génère le bundle `.mcpb` (installation Claude Desktop) |

## Architecture
- `src/services/` — authentification OAuth2, client HTTP mutualisé, traduction des erreurs.
- `src/schemas/` — formes de données + rendus markdown.
- `src/tools/` — **un fichier par domaine d'API** ; un outil = un `server.registerTool(...)`.
- **Règle stdio** : `stdout` est réservé au protocole JSON-RPC. Tout log/diagnostic passe par `console.error` (stderr).

## Proposer un changement
1. Forkez le dépôt et créez une branche.
2. `npm test` doit passer.
3. Si possible, lancez `npm run smoke` (avec vos identifiants) pour valider en conditions réelles.
4. Ouvrez une *Pull Request* en expliquant le **pourquoi** du changement.

## Sécurité
Ne committez **jamais** votre `.env`. En cas de fuite d'un secret, régénérez-le immédiatement sur francetravail.io.

## Publication (mainteneur)
Une release est déclenchée par un **tag** :
```bash
npm version patch        # met à jour la version + crée le tag
git push --follow-tags   # déclenche le workflow de publication
```
Le workflow [`publish-mcp.yml`](.github/workflows/publish-mcp.yml) compile, teste, publie sur **npm**, puis sur le **registre MCP officiel**.
