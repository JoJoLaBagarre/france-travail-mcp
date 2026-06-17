/**
 * Client HTTP mutualisé pour les API France Travail.
 *
 * Centralise : injection du Bearer (via getAccessToken), retry unique sur 401,
 * timeout, et parsing de l'en-tête Content-Range (pagination des offres).
 * Le code 206 (Partial Content) est traité comme un SUCCÈS.
 */
import axios, { type Method } from "axios";
import { getAccessToken, invalidateToken } from "./auth.js";
import { REQUEST_TIMEOUT_MS } from "../constants.js";

/** Statuts transitoires re-tentés avec back-off (429 = quota, 502/503 = indispo passagère). */
const RETRYABLE_STATUSES = new Set([429, 502, 503]);
const MAX_RETRIES = 2;
const RETRY_BASE_DELAY_MS = 1200; // les API ROME plafonnent à ~1 req/s

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export interface ContentRange {
  first: number;
  last: number;
  total: number;
}

export interface ApiResponse<T> {
  data: T;
  status: number;
  contentRange?: ContentRange;
}

export interface ApiRequestOptions {
  baseUrl: string;
  path: string;
  scope: string;
  method?: Method;
  params?: Record<string, unknown>;
  data?: unknown;
}

function parseContentRange(header: unknown): ContentRange | undefined {
  if (typeof header !== "string") return undefined;
  const match = header.match(/(\d+)-(\d+)\/(\d+)/);
  if (!match) return undefined;
  return { first: Number(match[1]), last: Number(match[2]), total: Number(match[3]) };
}

export async function apiRequest<T>(options: ApiRequestOptions): Promise<ApiResponse<T>> {
  const { baseUrl, path, scope, method = "GET", params, data } = options;

  const send = async () => {
    const token = await getAccessToken(scope);
    return axios.request<T>({
      url: `${baseUrl}${path}`,
      method,
      params,
      data,
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
        ...(data !== undefined ? { "Content-Type": "application/json" } : {}),
      },
      timeout: REQUEST_TIMEOUT_MS,
      // 2xx (dont 204) et 206 sont des succès ; tout le reste lève une erreur.
      validateStatus: (s) => (s >= 200 && s < 300) || s === 206,
    });
  };

  let response: Awaited<ReturnType<typeof send>> | undefined;
  let lastError: unknown;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      response = await send();
      break;
    } catch (error) {
      lastError = error;
      if (!axios.isAxiosError(error)) throw error;
      const status = error.response?.status;
      // 401 : token révoqué/expiré prématurément. On l'invalide et on retente —
      // mais seulement si un token était réellement en cache (sinon le 401 vient
      // de l'échange de token lui-même = identifiants invalides, inutile de boucler).
      if (status === 401 && invalidateToken(scope)) continue;
      // 429/502/503 : throttling ou indispo passagère -> back-off croissant puis retry.
      if (status !== undefined && RETRYABLE_STATUSES.has(status) && attempt < MAX_RETRIES) {
        await sleep(RETRY_BASE_DELAY_MS * (attempt + 1));
        continue;
      }
      throw error;
    }
  }
  if (!response) throw lastError;

  return {
    data: response.data,
    status: response.status,
    contentRange: parseContentRange(response.headers["content-range"]),
  };
}
