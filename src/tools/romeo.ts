/** Outil MCP — ROMEO 2 : prédiction de métier/code ROME à partir d'un texte libre (IA). */
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { apiRequest } from "../services/client.js";
import { handleApiError } from "../services/errors.js";
import { ROMEO_BASE, SCOPES } from "../constants.js";
import { truncate } from "../util.js";

const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
} as const;

interface RomeoPrediction {
  identifiant?: string;
  intitule?: string;
  metiersRome?: Array<{
    codeRome?: string;
    libelleRome?: string;
    codeAppellation?: string;
    libelleAppellation?: string;
    scorePrediction?: number;
  }>;
}

export function registerRomeoTools(server: McpServer): void {
  server.registerTool(
    "ft_predict_rome",
    {
      title: "Deviner le code ROME d'un intitulé (IA)",
      description:
        "Utilise ROMEO 2 (modèle d'IA de France Travail) pour rapprocher un intitulé de poste en texte libre " +
        "des métiers/appellations ROME les plus probables, avec un score de confiance (0 à 1). " +
        "C'est le meilleur moyen de convertir « ce que dit la personne » (ex. 'je répare des vélos', " +
        "'community manager') en code ROME exploitable par ft_search_offres et ft_search_entreprises.\n\n" +
        "Renvoie les prédictions triées par score décroissant. Ajustez seuilScore pour ne garder que les " +
        "prédictions fiables. Nécessite l'abonnement à l'API « ROMEO 2 » sur francetravail.io.",
      inputSchema: {
        intitule: z.string().min(2).max(255).describe("Intitulé/description du poste en texte libre"),
        nbResultats: z.number().int().min(1).max(10).optional().describe("Nombre de prédictions (défaut 5)"),
        seuilScore: z.number().min(0).max(1).optional().describe("Score minimum de confiance (0-1), ex. 0.5"),
        response_format: z.enum(["markdown", "json"]).optional(),
      },
      annotations: READ_ONLY,
    },
    async (args) => {
      try {
        const body = {
          appellations: [{ intitule: args.intitule, identifiant: "1" }],
          options: {
            nbResultats: args.nbResultats ?? 5,
            nomAppelant: "france-travail-mcp",
            // Active le calcul du score pour qu'il soit présent dans la réponse.
            toggleScorePrediction: true,
            ...(args.seuilScore !== undefined ? { seuilScorePrediction: args.seuilScore } : {}),
          },
        };
        const { data } = await apiRequest<RomeoPrediction[]>({
          baseUrl: ROMEO_BASE,
          path: "/predictionMetiers",
          scope: SCOPES.romeo,
          method: "POST",
          data: body,
        });

        if (args.response_format === "json") {
          return { content: [{ type: "text" as const, text: truncate(JSON.stringify(data, null, 2)) }] };
        }
        return {
          content: [{ type: "text" as const, text: truncate(renderPredictions(args.intitule, data, args.seuilScore)) }],
        };
      } catch (error) {
        return { content: [{ type: "text" as const, text: handleApiError(error) }], isError: true };
      }
    }
  );
}

/** Affiche un score (toléré en [0,1] ou en pourcentage 0-100) en pourcentage borné. */
function formatScore(raw?: number): string {
  if (raw === undefined) return "";
  const normalized = raw > 1 ? raw / 100 : raw;
  return ` — score ${Math.round(Math.min(1, Math.max(0, normalized)) * 100)}%`;
}

function renderPredictions(intitule: string, data: RomeoPrediction[], seuilScore?: number): string {
  const preds = Array.isArray(data) ? data : [];
  let rows = preds.flatMap((p) => p.metiersRome ?? []);
  // Filtrage local par seuil (garanti, indépendamment du support côté API).
  if (seuilScore !== undefined) {
    rows = rows.filter((r) => (r.scorePrediction ?? 0) >= seuilScore);
  }
  rows.sort((a, b) => (b.scorePrediction ?? 0) - (a.scorePrediction ?? 0));

  if (rows.length === 0) {
    // L'API a répondu mais aucun métier exploité : ne rien masquer si le format diffère.
    if (preds.length > 0 && seuilScore === undefined) {
      return `Réponse ROMEO au format inattendu pour « ${intitule} » :\n\`\`\`json\n${JSON.stringify(data, null, 2)}\n\`\`\``;
    }
    return (
      `Aucune prédiction ROME${seuilScore !== undefined ? ` au-dessus du seuil ${seuilScore}` : ""} ` +
      `pour « ${intitule} ». Reformulez ou abaissez seuilScore.`
    );
  }

  const lines = rows.map((r) => {
    const lib = r.libelleRome ?? r.libelleAppellation ?? "";
    return `- \`${r.codeRome ?? ""}\` — ${lib}${formatScore(r.scorePrediction)}`;
  });
  return `Codes ROME probables pour « ${intitule} » :\n\n${lines.join("\n")}`;
}
