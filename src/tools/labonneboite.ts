/**
 * Outil MCP — La Bonne Boîte v2 : entreprises à fort potentiel d'embauche.
 *
 * ⚠️ EXPÉRIMENTAL : ni l'endpoint, ni la version, ni les noms de paramètres de
 * l'API La Bonne Boîte n'ont pu être vérifiés en conditions réelles (API non
 * souscrite au moment du développement). Valeurs par défaut alignées sur la
 * signature documentée historiquement : ressource `/company/` + paramètre
 * `rome_codes` (codes ROME séparés par des virgules) + latitude/longitude/distance.
 * À CONFIRMER et ajuster (chemin, version v1/v2, noms de paramètres) une fois
 * l'abonnement actif. Le chemin est isolé dans LBB_SEARCH_PATH. Rendu défensif.
 */
import { z } from "zod";
import type { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { apiRequest } from "../services/client.js";
import { handleApiError } from "../services/errors.js";
import { LBB_BASE, SCOPES } from "../constants.js";
import { truncate } from "../util.js";

const READ_ONLY = {
  readOnlyHint: true,
  destructiveHint: false,
  idempotentHint: true,
  openWorldHint: true,
} as const;

/** À confirmer/ajuster après souscription à l'API La Bonne Boîte. */
const LBB_SEARCH_PATH = "/company/";

interface Entreprise {
  siret?: string;
  raisonSociale?: string;
  enseigne?: string;
  ville?: string;
  codePostal?: string;
  secteur?: string;
  score?: number;
  [k: string]: unknown;
}

export function registerLaBonneBoiteTools(server: McpServer): void {
  server.registerTool(
    "ft_search_entreprises",
    {
      title: "Entreprises qui recrutent (La Bonne Boîte) [expérimental]",
      description:
        "Liste les entreprises ayant la plus forte probabilité d'embauche pour un métier (code ROME) autour d'un " +
        "point géographique. Idéal pour la candidature spontanée : cible les employeurs susceptibles de recruter " +
        "même sans offre publiée. Fournissez un codeROME (via ft_predict_rome ou ft_search_metiers) et des " +
        "coordonnées (latitude/longitude).\n\n" +
        "⚠️ Outil expérimental (endpoint en cours de validation) ; nécessite l'abonnement à l'API " +
        "« La Bonne Boîte v2 » sur francetravail.io.",
      inputSchema: {
        codeROME: z.string().regex(/^[A-Z]\d{4}$/i).describe("Code ROME du métier visé (ex. 'M1607')"),
        latitude: z.number().min(-90).max(90).describe("Latitude du point de recherche"),
        longitude: z.number().min(-180).max(180).describe("Longitude du point de recherche"),
        distance: z.number().int().min(0).max(100).optional().describe("Rayon en km (défaut 10)"),
        limit: z.number().int().min(1).max(50).optional().describe("Nombre max d'entreprises (défaut 15)"),
        response_format: z.enum(["markdown", "json"]).optional(),
      },
      annotations: READ_ONLY,
    },
    async (args) => {
      try {
        const { data } = await apiRequest<{ items?: Entreprise[] } | Entreprise[]>({
          baseUrl: LBB_BASE,
          path: LBB_SEARCH_PATH,
          scope: SCOPES.labonneboite,
          params: {
            rome_codes: args.codeROME.toUpperCase(),
            latitude: args.latitude,
            longitude: args.longitude,
            distance: args.distance ?? 10,
          },
        });
        const items: Entreprise[] = Array.isArray(data) ? data : data?.items ?? [];
        const list = items.slice(0, args.limit ?? 15);

        if (args.response_format === "json") {
          return { content: [{ type: "text" as const, text: truncate(JSON.stringify(list, null, 2)) }] };
        }
        return { content: [{ type: "text" as const, text: truncate(renderEntreprises(list)) }] };
      } catch (error) {
        return { content: [{ type: "text" as const, text: handleApiError(error) }], isError: true };
      }
    }
  );
}

function renderEntreprises(items: Entreprise[]): string {
  if (items.length === 0) {
    return "Aucune entreprise trouvée. Élargissez le rayon ou vérifiez le code ROME et les coordonnées.";
  }
  return items
    .map((e, i) => {
      const nom = e.enseigne ?? e.raisonSociale ?? "(entreprise)";
      const lieu = [e.codePostal, e.ville].filter(Boolean).join(" ");
      const score = e.score !== undefined ? ` — potentiel ${e.score}` : "";
      const parts = [
        `**${i + 1}. ${nom}**${score}`,
        e.siret && `   SIRET ${e.siret}`,
        lieu && `   📍 ${lieu}`,
        e.secteur && `   🏭 ${e.secteur}`,
      ].filter(Boolean);
      return parts.join("\n");
    })
    .join("\n\n");
}
