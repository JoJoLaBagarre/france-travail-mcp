/** Schémas zod de sortie pour les offres d'emploi (API Offres d'emploi v2). */
import { z } from "zod";

/** Forme brute (partielle) d'une offre telle que renvoyée par l'API. */
export interface RawOffre {
  id?: string;
  intitule?: string;
  description?: string;
  dateCreation?: string;
  dateActualisation?: string;
  lieuTravail?: {
    libelle?: string;
    latitude?: number;
    longitude?: number;
    codePostal?: string;
    commune?: string;
  };
  romeCode?: string;
  romeLibelle?: string;
  appellationlibelle?: string;
  entreprise?: { nom?: string; description?: string; entrepriseAdaptee?: boolean };
  typeContrat?: string;
  typeContratLibelle?: string;
  natureContrat?: string;
  experienceExige?: string;
  experienceLibelle?: string;
  salaire?: { libelle?: string; commentaire?: string; complement1?: string; complement2?: string };
  dureeTravailLibelle?: string;
  dureeTravailLibelleConverti?: string;
  alternance?: boolean;
  nombrePostes?: number;
  qualificationLibelle?: string;
  secteurActiviteLibelle?: string;
  contact?: { nom?: string; courriel?: string; telephone?: string; urlPostulation?: string; coordonnees1?: string };
  origineOffre?: { origine?: string; urlOrigine?: string };
  competences?: Array<{ libelle?: string; exigence?: string }>;
  formations?: Array<{ niveauLibelle?: string; domaineLibelle?: string; exigence?: string }>;
}

/** Résumé d'offre renvoyé par la recherche (compact, pour préserver le contexte). */
export const offreSummarySchema = z.object({
  id: z.string(),
  intitule: z.string().optional(),
  entreprise: z.string().optional(),
  lieu: z.string().optional(),
  typeContrat: z.string().optional(),
  romeCode: z.string().optional(),
  romeLibelle: z.string().optional(),
  salaire: z.string().optional(),
  experience: z.string().optional(),
  alternance: z.boolean().optional(),
  dateCreation: z.string().optional(),
  url: z.string().optional(),
});
export type OffreSummary = z.infer<typeof offreSummarySchema>;

/** Métadonnées de pagination normalisées. */
export const paginationSchema = z.object({
  total: z.number(),
  count: z.number(),
  offset: z.number(),
  has_more: z.boolean(),
  next_offset: z.number().optional(),
});

export const searchOutputSchema = {
  ...paginationSchema.shape,
  offres: z.array(offreSummarySchema),
};

function salaireToString(s?: RawOffre["salaire"]): string | undefined {
  if (!s) return undefined;
  return [s.libelle, s.commentaire, s.complement1, s.complement2].filter(Boolean).join(" – ") || undefined;
}

export function toSummary(o: RawOffre): OffreSummary {
  return {
    id: o.id ?? "",
    intitule: o.intitule,
    entreprise: o.entreprise?.nom,
    lieu: o.lieuTravail?.libelle,
    typeContrat: o.typeContratLibelle ?? o.typeContrat,
    romeCode: o.romeCode,
    romeLibelle: o.romeLibelle,
    salaire: salaireToString(o.salaire),
    experience: o.experienceLibelle,
    alternance: o.alternance,
    dateCreation: o.dateCreation,
    url: o.origineOffre?.urlOrigine,
  };
}

/** Rendu markdown lisible d'une liste de résumés d'offres. */
export function summariesToMarkdown(
  offres: OffreSummary[],
  meta: { total: number; offset: number; count: number; has_more: boolean }
): string {
  if (offres.length === 0) {
    return "Aucune offre ne correspond à ces critères. Élargissez la recherche (rayon, mots-clés, type de contrat).";
  }
  const lines = offres.map((o, i) => {
    const n = meta.offset + i + 1;
    const parts = [
      `**${n}. ${o.intitule ?? "(sans intitulé)"}**  \`${o.id}\``,
      o.entreprise && `   🏢 ${o.entreprise}`,
      o.lieu && `   📍 ${o.lieu}`,
      o.typeContrat && `   📄 ${o.typeContrat}${o.alternance ? " · alternance" : ""}`,
      (o.romeCode || o.romeLibelle) && `   🧭 ROME ${o.romeCode ?? ""} ${o.romeLibelle ?? ""}`.trimEnd(),
      o.salaire && `   💶 ${o.salaire}`,
      o.experience && `   🎓 ${o.experience}`,
      o.url && `   🔗 ${o.url}`,
    ].filter(Boolean);
    return parts.join("\n");
  });
  const moreUnreachable = !meta.has_more && meta.total > meta.offset + meta.count;
  const header =
    `${meta.total} offre(s) au total — affichage ${meta.offset + 1}–${meta.offset + meta.count}` +
    (meta.has_more
      ? " (plus de résultats disponibles, augmentez 'offset').\n"
      : moreUnreachable
        ? ".\n⚠️ D'autres offres existent mais la profondeur de pagination est limitée (~1150 résultats). " +
          "Affinez les filtres (commune, codeROME, typeContrat…) pour les atteindre.\n"
        : ".\n");
  return header + "\n" + lines.join("\n\n");
}

/** Rendu markdown détaillé d'une offre complète. */
export function detailToMarkdown(o: RawOffre): string {
  const sections: string[] = [];
  sections.push(`# ${o.intitule ?? "Offre"}  \`${o.id ?? ""}\``);
  const meta = [
    o.entreprise?.nom && `**Entreprise :** ${o.entreprise.nom}`,
    o.lieuTravail?.libelle && `**Lieu :** ${o.lieuTravail.libelle}` +
      (o.lieuTravail.codePostal ? ` (${o.lieuTravail.codePostal})` : ""),
    (o.typeContratLibelle ?? o.typeContrat) && `**Contrat :** ${o.typeContratLibelle ?? o.typeContrat}`,
    o.dureeTravailLibelle && `**Durée :** ${o.dureeTravailLibelle.replace(/\n/g, " ")}`,
    salaireToString(o.salaire) && `**Salaire :** ${salaireToString(o.salaire)}`,
    o.experienceLibelle && `**Expérience :** ${o.experienceLibelle}`,
    (o.romeCode || o.romeLibelle) && `**Métier (ROME) :** ${o.romeCode ?? ""} — ${o.romeLibelle ?? ""}`,
    o.nombrePostes && `**Postes :** ${o.nombrePostes}`,
    o.secteurActiviteLibelle && `**Secteur :** ${o.secteurActiviteLibelle}`,
  ].filter(Boolean);
  sections.push(meta.join("  \n"));

  if (o.description) sections.push(`## Description\n${o.description}`);

  if (o.competences?.length) {
    sections.push(
      "## Compétences\n" +
        o.competences.map((c) => `- ${c.libelle ?? ""}${c.exigence ? ` (${c.exigence})` : ""}`).join("\n")
    );
  }
  if (o.formations?.length) {
    sections.push(
      "## Formations\n" +
        o.formations
          .map((f) => `- ${[f.niveauLibelle, f.domaineLibelle].filter(Boolean).join(" – ")}${f.exigence ? ` (${f.exigence})` : ""}`)
          .join("\n")
    );
  }
  const lien = o.origineOffre?.urlOrigine;
  if (lien) sections.push(`## Postuler\n🔗 ${lien}`);

  return sections.join("\n\n");
}
