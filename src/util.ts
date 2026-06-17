/** Utilitaires partagés. */
import { CHARACTER_LIMIT } from "./constants.js";

/** Tronque un texte trop long en ajoutant un avertissement pour l'agent. */
export function truncate(text: string, limit: number = CHARACTER_LIMIT): string {
  if (text.length <= limit) return text;
  return (
    text.slice(0, limit) +
    `\n\n[…réponse tronquée à ${limit} caractères. Affinez la recherche (filtres) ` +
    `ou réduisez 'limit' / paginez avec 'offset' pour voir le reste.]`
  );
}

/** Joint un tableau de codes en chaîne séparée par des virgules (ou undefined si vide). */
export function joinCodes(values?: string[]): string | undefined {
  if (!values || values.length === 0) return undefined;
  return values.join(",");
}
