/** Configuration applicative (localStorage, sans schéma Supabase). */

export const STORAGE_KEYS = {
  MAINTENANCE: "footbooking_maintenance_mode",
  ADMIN_NOTIF_READ: "footbooking_admin_notif_read",
  REPORTS: "footbooking_reports",
};

export const CONFIG_EVENTS = {
  CHANGED: "footbooking:config-changed",
};

export function getMaintenanceMode() {
  try {
    return localStorage.getItem(STORAGE_KEYS.MAINTENANCE) === "true";
  } catch {
    return false;
  }
}

export function setMaintenanceMode(enabled) {
  try {
    localStorage.setItem(STORAGE_KEYS.MAINTENANCE, enabled ? "true" : "false");
    window.dispatchEvent(
      new CustomEvent(CONFIG_EVENTS.CHANGED, { detail: { maintenance: enabled } }),
    );
  } catch {
    /* ignore */
  }
}

export function getReadNotificationIds() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.ADMIN_NOTIF_READ);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function markNotificationIdsRead(ids) {
  try {
    const current = new Set(getReadNotificationIds());
    ids.forEach((id) => current.add(id));
    localStorage.setItem(
      STORAGE_KEYS.ADMIN_NOTIF_READ,
      JSON.stringify([...current]),
    );
    window.dispatchEvent(new CustomEvent(CONFIG_EVENTS.CHANGED));
  } catch {
    /* ignore */
  }
}

export function markAllNotificationsRead(ids) {
  markNotificationIdsRead(ids);
}

const DEFAULT_REPORTS = [
  {
    id: "rep-001",
    type: "comportement",
    status: "nouveau",
    reporterName: "Amadou Diallo",
    targetType: "utilisateur",
    targetLabel: "Utilisateur #a1b2",
    description: "Comportement inapproprié lors d'une réservation.",
    createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    adminComment: "",
  },
  {
    id: "rep-002",
    type: "terrain",
    status: "en_cours",
    reporterName: "Fatou Sène",
    targetType: "terrain",
    targetLabel: "Terrain Oasis Sport",
    description: "Photos ne correspondent pas à la réalité.",
    createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
    adminComment: "Contact propriétaire en attente.",
  },
  {
    id: "rep-003",
    type: "paiement",
    status: "resolu",
    reporterName: "Ibrahima Ndiaye",
    targetType: "reservation",
    targetLabel: "Réservation du 12/05",
    description: "Double débit signalé par le client.",
    createdAt: new Date(Date.now() - 86400000 * 10).toISOString(),
    adminComment: "Remboursement validé.",
  },
];

export function getReports() {
  try {
    const raw = localStorage.getItem(STORAGE_KEYS.REPORTS);
    if (!raw) {
      localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(DEFAULT_REPORTS));
      return [...DEFAULT_REPORTS];
    }
    return JSON.parse(raw);
  } catch {
    return [...DEFAULT_REPORTS];
  }
}

export function saveReports(reports) {
  try {
    localStorage.setItem(STORAGE_KEYS.REPORTS, JSON.stringify(reports));
    window.dispatchEvent(new CustomEvent(CONFIG_EVENTS.CHANGED));
  } catch {
    /* ignore */
  }
}
