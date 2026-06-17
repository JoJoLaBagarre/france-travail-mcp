/**
 * Traduction des erreurs (réseau / HTTP France Travail) en messages
 * actionnables pour l'agent, sans fuiter de détails internes.
 */
import axios from "axios";

export function handleApiError(error: unknown): string {
  if (axios.isAxiosError(error)) {
    const status = error.response?.status;
    const data = error.response?.data as
      | { error_description?: string; error?: string; message?: string; codeErreur?: string }
      | undefined;
    // L'OAuth renvoie error_description/error ; l'API Offres renvoie message (+ codeErreur).
    const description = data?.error_description ?? data?.error ?? data?.message;

    // Cas spécifique : scope OAuth non autorisé (API non souscrite par l'application).
    if (description && /scope/i.test(description)) {
      return (
        "API non activée pour votre application (scope OAuth non autorisé). " +
        "Connectez-vous sur https://francetravail.io → votre application → souscrivez à l'API concernée, " +
        "puis réessayez."
      );
    }

    switch (status) {
      case 400:
        return (
          "Requête invalide (400). Vérifiez les paramètres : code ROME (5 caractères, ex. M1607), " +
          "code commune INSEE (5 chiffres), dates au format ISO-8601. " +
          "Astuce : récupérez les codes valides avec l'outil ft_list_referentiel." +
          (description ? ` Détail : ${description}` : "")
        );
      case 401:
        return "Authentification échouée (401). Vérifiez FT_CLIENT_ID et FT_CLIENT_SECRET.";
      case 403:
        return (
          "Accès refusé (403). Votre application France Travail n'est probablement pas abonnée à cette API. " +
          "Souscrivez-la sur https://francetravail.io → votre application."
        );
      case 404:
        return "Ressource introuvable (404). Vérifiez l'identifiant fourni.";
      case 429:
        return "Quota dépassé (429). L'API France Travail limite le débit ; patientez quelques secondes avant de réessayer.";
      case 500:
      case 502:
      case 503:
      case 504:
        return `Erreur serveur France Travail (${status}). Réessayez dans un instant.`;
    }

    if (error.code === "ECONNABORTED") {
      return "Délai d'attente dépassé. Réessayez.";
    }
    if (description) {
      return `Erreur API France Travail : ${description}`;
    }
    return `Erreur réseau : ${error.message}`;
  }

  return `Erreur inattendue : ${error instanceof Error ? error.message : String(error)}`;
}
