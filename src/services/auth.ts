/**
 * Authentification OAuth2 « client credentials » France Travail.
 *
 * Le token (Bearer) a une durée de vie courte (~1500 s) et il n'existe pas de
 * refresh_token : on en redemande simplement un nouveau à l'expiration.
 *
 * Stratégie de cache :
 *  - un cache PAR scope (chaque API ayant son propre scope) ;
 *  - une marge de sécurité (REFRESH_MARGIN_MS) pour rafraîchir avant l'expiration ;
 *  - sérialisation des demandes concurrentes (« inflight ») pour qu'un seul
 *    appel token parte même si plusieurs outils démarrent en parallèle.
 */
import axios from "axios";
import { TOKEN_URL, REQUEST_TIMEOUT_MS } from "../constants.js";

interface CachedToken {
  token: string;
  /** Timestamp (ms) d'expiration effective, marge de sécurité déjà déduite. */
  expiresAt: number;
}

interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope: string;
}

const REFRESH_MARGIN_MS = 60_000;

const cache = new Map<string, CachedToken>();
const inflight = new Map<string, Promise<string>>();

function getCredentials(): { clientId: string; clientSecret: string } {
  const clientId = process.env.FT_CLIENT_ID;
  const clientSecret = process.env.FT_CLIENT_SECRET;
  if (!clientId || !clientSecret) {
    throw new Error(
      "Identifiants manquants : définissez FT_CLIENT_ID et FT_CLIENT_SECRET " +
        "(voir .env.example). Créez une application sur https://francetravail.io."
    );
  }
  return { clientId, clientSecret };
}

/** Retourne un access_token valide pour le scope demandé (depuis le cache si possible). */
export async function getAccessToken(scope: string): Promise<string> {
  const cached = cache.get(scope);
  if (cached && Date.now() < cached.expiresAt) {
    return cached.token;
  }

  const pending = inflight.get(scope);
  if (pending) return pending;

  const request = requestToken(scope).finally(() => inflight.delete(scope));
  inflight.set(scope, request);
  return request;
}

async function requestToken(scope: string): Promise<string> {
  const { clientId, clientSecret } = getCredentials();
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
    scope,
  });

  const response = await axios.post<TokenResponse>(TOKEN_URL, body.toString(), {
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    timeout: REQUEST_TIMEOUT_MS,
  });

  const { access_token, expires_in } = response.data;
  cache.set(scope, {
    token: access_token,
    expiresAt: Date.now() + expires_in * 1000 - REFRESH_MARGIN_MS,
  });
  return access_token;
}

/**
 * Invalide le token caché pour un scope (utilisé pour retenter après un 401).
 * Retourne true si un token était effectivement en cache.
 */
export function invalidateToken(scope: string): boolean {
  return cache.delete(scope);
}
