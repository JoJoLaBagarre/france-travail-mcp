// Smoke test : pilote le serveur MCP via le protocole JSON-RPC (stdio, newline-delimited).
// Prérequis : `npm run build` puis un fichier .env avec FT_CLIENT_ID / FT_CLIENT_SECRET
// (application abonnée à « Offres d'emploi v2 »). Lancement : `node scripts/smoke.mjs`.
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const child = spawn(process.execPath, [path.join(root, "dist", "index.js")], {
  cwd: root,
  stdio: ["pipe", "pipe", "inherit"], // stderr -> notre console
});

let buf = "";
const pending = new Map();
child.stdout.on("data", (d) => {
  buf += d.toString();
  let nl;
  while ((nl = buf.indexOf("\n")) >= 0) {
    const line = buf.slice(0, nl).trim();
    buf = buf.slice(nl + 1);
    if (!line) continue;
    let msg;
    try { msg = JSON.parse(line); } catch { continue; }
    if (msg.id && pending.has(msg.id)) {
      pending.get(msg.id)(msg);
      pending.delete(msg.id);
    }
  }
});

let idc = 0;
function rpc(method, params) {
  const id = ++idc;
  return new Promise((resolve) => {
    pending.set(id, resolve);
    child.stdin.write(JSON.stringify({ jsonrpc: "2.0", id, method, params }) + "\n");
  });
}
function notify(method, params) {
  child.stdin.write(JSON.stringify({ jsonrpc: "2.0", method, params }) + "\n");
}

const firstText = (r) => r?.result?.content?.[0]?.text ?? JSON.stringify(r?.error ?? r?.result ?? r);

await new Promise((r) => setTimeout(r, 400)); // laisse le serveur démarrer

const init = await rpc("initialize", {
  protocolVersion: "2024-11-05",
  capabilities: {},
  clientInfo: { name: "smoke", version: "0" },
});
console.log("INIT serverInfo:", JSON.stringify(init.result?.serverInfo));
notify("notifications/initialized");

const tools = await rpc("tools/list", {});
console.log("\nTOOLS:", (tools.result?.tools ?? []).map((t) => t.name).join(", "));

console.log("\n=== ft_search_offres (boulanger, Lyon 69381, CDI, limit 2) ===");
const s = await rpc("tools/call", {
  name: "ft_search_offres",
  arguments: { motsCles: "boulanger", commune: "69381", distance: 20, typeContrat: ["CDI"], limit: 2 },
});
console.log(firstText(s));
console.log("structuredContent.total =", s.result?.structuredContent?.total);

console.log("\n=== ft_list_referentiel (typesContrats) ===");
const ref = await rpc("tools/call", { name: "ft_list_referentiel", arguments: { type: "typesContrats" } });
console.log(firstText(ref).split("\n").slice(0, 6).join("\n"));

console.log("\n=== ft_get_offre (id tiré de la recherche) ===");
const firstId = s.result?.structuredContent?.offres?.[0]?.id;
if (firstId) {
  const det = await rpc("tools/call", { name: "ft_get_offre", arguments: { id: firstId } });
  console.log(firstText(det).split("\n").slice(0, 8).join("\n"));
} else {
  console.log("(pas d'id à tester)");
}

console.log("\n=== ft_search_metiers (boulanger) ===");
const rome = await rpc("tools/call", { name: "ft_search_metiers", arguments: { query: "boulanger", limit: 3 } });
console.log("isError =", rome.result?.isError, "| count =", rome.result?.structuredContent?.count);
console.log(firstText(rome).split("\n").slice(0, 6).join("\n"));

console.log("\n=== ft_get_metier (D1102) ===");
const metier = await rpc("tools/call", { name: "ft_get_metier", arguments: { code: "D1102" } });
console.log(firstText(metier).split("\n").slice(0, 4).join("\n"));

console.log("\n=== ft_get_fiche_metier (D1102) ===");
const fiche = await rpc("tools/call", { name: "ft_get_fiche_metier", arguments: { code: "D1102" } });
console.log("isError =", fiche.result?.isError, "| extrait :", firstText(fiche).slice(0, 120).replace(/\n/g, " "));

console.log("\n=== ft_predict_rome (texte libre 'je répare des vélos') ===");
const predict = await rpc("tools/call", {
  name: "ft_predict_rome",
  arguments: { intitule: "je répare des vélos", nbResultats: 3 },
});
console.log(firstText(predict));

child.kill();
console.log("\n✅ Smoke test terminé.");
process.exit(0);
