/**
 * Constantes partagées : URLs des API France Travail, scopes OAuth2 et limites.
 */

/** Endpoint OAuth2 (client_credentials). Le paramètre realm=/partenaire est obligatoire. */
export const TOKEN_URL =
  "https://entreprise.francetravail.fr/connexion/oauth2/access_token?realm=%2Fpartenaire";

/** Racine commune de toutes les API partenaires. */
export const API_BASE = "https://api.francetravail.io/partenaire";

export const OFFRES_BASE = `${API_BASE}/offresdemploi/v2`;
export const ROME_METIERS_BASE = `${API_BASE}/rome-metiers/v1`;
export const ROME_FICHES_BASE = `${API_BASE}/rome-fiches-metiers/v1`;
export const ROMEO_BASE = `${API_BASE}/romeo/v2`;
export const LBB_BASE = `${API_BASE}/labonneboite/v2`;

/**
 * Scopes OAuth2 par domaine fonctionnel. Un token est mis en cache PAR scope
 * (voir services/auth.ts), ce qui évite d'avoir à cumuler des scopes
 * d'API potentiellement non souscrites dans une même demande de token.
 */
export const SCOPES = {
  offres: "api_offresdemploiv2 o2dsoffre",
  romeMetiers: "api_rome-metiersv1 nomenclatureRome",
  romeFiches: "api_rome-fiches-metiersv1 nomenclatureRome",
  romeo: "api_romeov2",
  labonneboite: "api_labonneboitev2",
} as const;

/** Au-delà de cette taille (caractères), une réponse texte est tronquée pour préserver le contexte de l'agent. */
export const CHARACTER_LIMIT = 25_000;

/** Timeout réseau par requête. */
export const REQUEST_TIMEOUT_MS = 30_000;

/** Nombre maximum d'offres restituables en une seule requête de recherche (contrainte API). */
export const MAX_RESULTS_PER_PAGE = 150;

/** Index de départ maximal accepté par l'API Offres (1er élément <= 1000). */
export const MAX_SEARCH_OFFSET = 1000;

/** Profondeur de pagination maximale (dernier élément <= 1149). Au-delà, affiner les filtres. */
export const MAX_SEARCH_DEPTH = 1149;
