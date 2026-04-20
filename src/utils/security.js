/**
 * Utilitaires de sécurité pour l'application
 */

/**
 * Désinfecte une chaîne de caractères pour éviter l'injection HTML/XSS
 * @param {string} str - La chaîne à désinfecter
 * @returns {string} - La chaîne nettoyée
 */
export const sanitizeString = (str) => {
  if (typeof str !== "string") return "";
  return str
    .trim()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
};

/**
 * Restaure les caractères HTML échappés pour un affichage propre dans React
 * @param {string} str - La chaîne avec des entités HTML
 * @returns {string} - La chaîne décodée
 */
export const decodeSanitizedString = (str) => {
  if (typeof str !== "string") return "";
  return str
    .replace(/&#039;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&amp;/g, "&");
};

/**
 * Nettoie un numéro de téléphone (ne garde que les chiffres et le '+')
 * @param {string} phone - Le numéro à nettoyer
 * @returns {string} - Le numéro nettoyé
 */
export const sanitizePhone = (phone) => {
  if (typeof phone !== "string") return "";
  return phone.trim().replace(/[^\d+]/g, "");
};

/**
 * Formate un message d'erreur Supabase pour l'utilisateur
 * @param {object} error - L'objet erreur de Supabase
 * @returns {string} - Un message clair et sécurisé
 */
export const getSafeErrorMessage = (error) => {
  if (!error) return "Une erreur inconnue est survenue.";

  // Erreurs Postgres communes
  switch (error.code) {
    case "23505":
      return "Cette donnée existe déjà.";
    case "23P01":
      return "Ce créneau est déjà réservé (conflit de réservation).";
    case "42501":
      return "Vous n'avez pas la permission d'effectuer cette action.";
    case "23503":
      return "Une donnée liée est manquante ou invalide.";
    default:
      // En production, on évite d'exposer les détails techniques bruts
      return error.message || "Une erreur réseau ou base de données est survenue.";
  }
};
