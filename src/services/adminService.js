import { supabase } from "./supabaseClient";
import { ReservationService } from "./ReservationService";

// --- PLATFORM SETTINGS ---

export const getPlatformSettings = async () => {
  const { data, error } = await supabase
    .from("platform_settings")
    .select("*")
    .eq("id", true)
    .single();

  if (error) throw error;
  return data;
};

export const updatePlatformSettings = async (updates) => {
  const { data, error } = await supabase
    .from("platform_settings")
    .update({ ...updates, updated_at: new Date().toISOString() })
    .eq("id", true)
    .select();

  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error("Aucune ligne mise à jour. Vérifiez vos permissions.");
  }
  await logAdminAction("updated_platform_settings", "platform", null, updates);
};

// --- NOTIFICATIONS ---

export const getNotifications = async () => {
  const { data, error } = await supabase
    .from("notifications")
    .select("id, title, message, type, is_read, created_at, link, meta")
    .order("created_at", { ascending: false })
    .limit(30);

  if (error) throw error;
  return data || [];
};

export const markNotificationRead = async (notificationId) => {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("id", notificationId);

  if (error) throw error;
};

export const markAllNotificationsReadSupabase = async () => {
  const { error } = await supabase
    .from("notifications")
    .update({ is_read: true })
    .eq("is_read", false);

  if (error) throw error;
};

// Log admin action
export const logAdminAction = async (action, targetTable, targetId, details = {}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  const { error } = await supabase.from("admin_logs").insert([{
    admin_id: user.id,
    action,
    target_table: targetTable,
    target_id: targetId,
    details
  }]);
  if (error) console.error("logAdminAction failed:", error);
};

// Récupérer les logs récents
export const getRecentAdminLogs = async (limit = 10) => {
  const { data, error } = await supabase
    .from("admin_logs")
    .select(`
      id, action, target_table, target_id, created_at,
      profiles:admin_id (name)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) {
    console.error("Error fetching logs:", error);
    return [];
  }
  return data || [];
};

// Obtenir les statistiques enrichies du dashboard
export const getAdminStats = async () => {
  try {
    const now = new Date();
    const twelveMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 11, 1).toISOString();

    const [fieldsRes, usersRes, bookingsRes, ownersRes, recentBookingsRes, newUsersRes] = await Promise.all([
      supabase.from("fields").select("id, field_source", { count: "exact" }).is("deleted_at", null),
      supabase.from("profiles").select("id, role, created_at", { count: "exact" }),
      supabase.from("reservations").select("id, total_price, status, date, created_at, fields(name)", { count: "exact" }).gte("created_at", twelveMonthsAgo),
      supabase.from("profiles").select("id", { count: "exact" }).eq("role", "owner"),
      supabase.from("reservations").select("id, date, start_time, end_time, total_price, status, client_name, user_id, created_at, fields(name)").order("created_at", { ascending: false }).limit(6),
      supabase.from("profiles").select("id, name, created_at, role").order("created_at", { ascending: false }).limit(5),
    ]);

    const totalFields = fieldsRes.count || 0;
    const totalUsers = usersRes.count || 0;
    const totalBookings = bookingsRes.count || 0;
    const totalOwners = ownersRes.count || 0;

    // Revenu total
    let totalRevenue = 0;
    const bookingsData = bookingsRes.data || [];
    bookingsData.forEach(b => {
      if (b.status === "Confirmé" || b.status === "Payé" || b.status === "completed") {
        totalRevenue += b.total_price || 0;
      }
    });

    // Réservations par mois (12 derniers mois)
    const monthNames = ["Jan", "Fév", "Mar", "Avr", "Mai", "Juin", "Juil", "Août", "Sep", "Oct", "Nov", "Déc"];
    const bookingsByMonth = {};
    const revenueByMonth = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      bookingsByMonth[key] = { name: monthNames[d.getMonth()], value: 0 };
      revenueByMonth[key] = { name: monthNames[d.getMonth()], value: 0 };
    }
    bookingsData.forEach(b => {
      const d = new Date(b.created_at);
      const key = `${d.getFullYear()}-${d.getMonth()}`;
      if (bookingsByMonth[key]) bookingsByMonth[key].value += 1;
      if (revenueByMonth[key] && (b.status === "Confirmé" || b.status === "Payé" || b.status === "completed")) {
        revenueByMonth[key].value += b.total_price || 0;
      }
    });

    // Terrains les plus réservés
    const fieldBookingCount = {};
    bookingsData.forEach(b => {
      const name = b.fields?.name || "Inconnu";
      fieldBookingCount[name] = (fieldBookingCount[name] || 0) + 1;
    });
    const topFields = Object.entries(fieldBookingCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([name, count]) => ({ name, count }));

    return {
      totalFields,
      totalUsers,
      totalBookings,
      totalRevenue,
      totalOwners,
      bookingsByMonth: Object.values(bookingsByMonth),
      revenueByMonth: Object.values(revenueByMonth),
      recentBookings: recentBookingsRes.data || [],
      newUsers: newUsersRes.data || [],
      topFields,
    };
  } catch (error) {
    console.error("Error fetching admin stats", error);
    return {
      totalFields: 0, totalUsers: 0, totalBookings: 0, totalRevenue: 0, totalOwners: 0,
      bookingsByMonth: [], revenueByMonth: [], recentBookings: [], newUsers: [], topFields: []
    };
  }
};

// Terrains avec pagination et filtre
export const getAdminFields = async (page = 1, limit = 10, sourceFilter = "all") => {
  let query = supabase
    .from("fields")
    .select(`
      id, name, adress, price_per_hour, pelouse, field_source, status, created_at, proprietaire_id, field_images (url_image)
    `, { count: "exact" })
    .is("deleted_at", null); // Soft delete

  if (sourceFilter !== "all") {
    query = query.eq("field_source", sourceFilter);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to).order("created_at", { ascending: false });

  const { data, count, error } = await query;
  if (error) {
    console.error("Supabase error getAdminFields :", error);
    throw error;
  }
  
  return { data, count };
};

// Récupérer la liste complète des terrains avec propriétaires, réservations et images pour un filtrage instantané côté client
export const getAdminFieldsFull = async () => {
  const { data, error } = await supabase
    .from("fields")
    .select(`
      id, name, adress, price_per_hour, pelouse, capacity, field_source, status, created_at, proprietaire_id, description,
      profiles:proprietaire_id (name, phone, ville, role),
      field_images (url_image),
      disponibilite (id, day_of_week, start_time, end_time),
      reservations (
        id, date, start_time, end_time, total_price, status, client_name, created_at
      )
    `)
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("Error fetching admin fields full:", error);
    throw error;
  }
  return data || [];
};

// Mettre à jour les informations d'un terrain par l'admin
export const updateAdminField = async (fieldId, updatedData, imageFile) => {
  // 1. Mettre à jour la table fields
  const { error: updateError } = await supabase
    .from("fields")
    .update({
      name: updatedData.name,
      adress: updatedData.adress,
      price_per_hour: parseFloat(updatedData.price_per_hour) || 0,
      pelouse: updatedData.pelouse,
      capacity: parseInt(updatedData.capacity) || 10,
      description: updatedData.description,
      status: updatedData.status || "active"
    })
    .eq("id", fieldId);

  if (updateError) throw updateError;

  // 2. Si une nouvelle image est spécifiée, l'envoyer et la lier au terrain
  if (imageFile) {
    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from("terrain-images").upload(fileName, imageFile);
    if (uploadError) throw uploadError;
    
    const { data: { publicUrl } } = supabase.storage.from("terrain-images").getPublicUrl(fileName);

    // Pour l'admin, on ajoute cette image principale
    const { error: imgError } = await supabase.from("field_images").insert({
      terrain_id: fieldId,
      url_image: publicUrl
    });
    if (imgError) console.error("Error inserting image record:", imgError);
  }

  await logAdminAction("updated_field", "fields", fieldId, updatedData);
};

// Suspendre ou réactiver un terrain
export const toggleFieldStatus = async (fieldId, currentStatus) => {
  const newStatus = currentStatus === "active" ? "inactive" : "active";
  const { error } = await supabase
    .from("fields")
    .update({ status: newStatus })
    .eq("id", fieldId);
    
  if (error) throw error;
  
  await logAdminAction(
    newStatus === "active" ? "activated_field" : "deactivated_field", 
    "fields", 
    fieldId
  );
  
  return newStatus;
};

// Soft delete un terrain
export const softDeleteField = async (fieldId) => {
  const { error } = await supabase
    .from("fields")
    .update({ deleted_at: new Date().toISOString(), status: "inactive" })
    .eq("id", fieldId);
    
  if (error) throw error;
  await logAdminAction("soft_deleted_field", "fields", fieldId);
};

// Créer un terrain vitrine (admin)
export const createVitrineField = async (terrainData, imageFile) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error("Non authentifié.");

  let imageUrl = null;
  if (imageFile) {
    const fileExt = imageFile.name.split(".").pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;
    const { error: uploadError } = await supabase.storage.from("terrain-images").upload(fileName, imageFile);
    if (uploadError) throw uploadError;
    const { data: { publicUrl } } = supabase.storage.from("terrain-images").getPublicUrl(fileName);
    imageUrl = publicUrl;
  }

  const descriptionText = terrainData.description || "";

  const { data: terrain, error } = await supabase.from("fields").insert({
    name: terrainData.name,
    adress: terrainData.adress,
    price_per_hour: parseFloat(terrainData.price_per_hour) || 0,
    pelouse: terrainData.pelouse || "Synthétique",
    capacity: parseInt(terrainData.capacity) || 10,
    description: descriptionText,
    field_source: "admin", // Le marque comme terrain vitrine
    status: "active",
    proprietaire_id: user.id // Le super admin
  }).select().single();

  if (error) throw error;

  if (imageUrl) {
    await supabase.from("field_images").insert({
      terrain_id: terrain.id,
      url_image: imageUrl
    });
  }

  await logAdminAction("created_vitrine_field", "fields", terrain.id);

  return terrain;
};

// --- PHASE 2 : USERS, OWNERS, BOOKINGS ---

// Obtenir tous les utilisateurs
export const getAdminUsers = async (page = 1, limit = 10, search = "") => {
  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" });

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to).order("created_at", { ascending: false });

  const { data, count, error } = await query;
  if (error) throw error;
  
  return { data, count };
};

// Changer le rôle d'un utilisateur
export const updateUserRole = async (userId, newRole) => {
  const { error } = await supabase
    .from("profiles")
    .update({ role: newRole })
    .eq("id", userId);
    
  if (error) throw error;
  await logAdminAction(`changed_role_to_${newRole}`, "profiles", userId);
};

// Obtenir les réservations (vue globale toutes sources)
export const getAdminBookings = async (page = 1, limit = 10, statusFilter = "all") => {
  let query = supabase
    .from("reservations")
    .select(`
      id, date, start_time, end_time, total_price, status, created_at,
      client_name, client_phone, user_id, payment_method,
      fields (name)
    `, { count: "exact" });

  if (statusFilter !== "all") {
    query = query.eq("status", statusFilter);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to).order("created_at", { ascending: false });

  const { data, count, error } = await query;
  if (error) {
    console.error("getAdminBookings error:", error);
    throw error;
  }
  
  return { data, count };
};

// Obtenir les propriétaires
export const getAdminOwners = async (page = 1, limit = 10, search = "") => {
  let query = supabase
    .from("profiles")
    .select("id, name, phone, ville, created_at, role", { count: "exact" })
    .eq("role", "owner");

  if (search) {
    query = query.ilike("name", `%${search}%`);
  }

  const from = (page - 1) * limit;
  const to = from + limit - 1;
  query = query.range(from, to).order("created_at", { ascending: false });

  const { data, count, error } = await query;
  if (error) throw error;

  // Enrichir avec le compte de terrains actifs pour chaque propriétaire
  if (!data?.length) return { data: [], count: 0 };

  const ownerIds = data.map(o => o.id);
  const { data: fieldCounts } = await supabase
    .from("fields")
    .select("proprietaire_id")
    .in("proprietaire_id", ownerIds)
    .is("deleted_at", null);

  const countMap = (fieldCounts || []).reduce((acc, f) => {
    acc[f.proprietaire_id] = (acc[f.proprietaire_id] || 0) + 1;
    return acc;
  }, {});

  const enriched = data.map(o => ({ ...o, fieldCount: countMap[o.id] || 0 }));

  return { data: enriched, count };
};

// Suspendre un propriétaire (repasse en 'user')
export const suspendOwner = async (ownerId) => {
  const { error } = await supabase
    .from("profiles")
    .update({ role: "user", backup_role: "owner" })
    .eq("id", ownerId);
  if (error) throw error;
  await logAdminAction("suspended_owner", "profiles", ownerId);
};

// Réactiver un propriétaire suspendu
export const reactivateOwner = async (userId) => {
  const { error } = await supabase
    .from("profiles")
    .update({ role: "owner", backup_role: null })
    .eq("id", userId);
  if (error) throw error;
  await logAdminAction("reactivated_owner", "profiles", userId);
};

export const isProfileInactive = (profile) => profile?.is_active === false;

// Bloquer / débloquer via le champ existant profiles.is_active
export const blockUser = async (userId) => {
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: false })
    .eq("id", userId);
  if (error) throw error;
  await logAdminAction("blocked_user", "profiles", userId, { is_active: false });
};

export const unblockUser = async (userId) => {
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: true })
    .eq("id", userId);
  if (error) throw error;
  await logAdminAction("unblocked_user", "profiles", userId, { is_active: true });
};

// Valider ou annuler une réservation (même flux que le dashboard propriétaire)
export const updateAdminBookingStatus = async (bookingId, status) => {
  const updated = await ReservationService.updateStatus(bookingId, status);

  const action =
    status === "Confirmé" || status === "Payé"
      ? "confirmed_booking"
      : status === "Annulé"
        ? "cancelled_booking"
        : "updated_booking_status";

  await logAdminAction(action, "reservations", bookingId, { status });
  return updated;
};

const matchesSearch = (value, needle) =>
  String(value ?? "").toLowerCase().includes(needle);

// Recherche globale admin
export const globalAdminSearch = async (query) => {
  const trimmed = query?.trim();
  if (!trimmed || trimmed.length < 2) {
    return { users: [], fields: [], bookings: [], owners: [] };
  }

  const needle = trimmed.toLowerCase();
  const term = `%${trimmed}%`;

  const [profilesRes, fieldsRes, bookingsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, name, phone, role, is_active")
      .limit(80),
    supabase
      .from("fields")
      .select("id, name, adress, field_source, status")
      .or(`name.ilike.${term},adress.ilike.${term}`)
      .is("deleted_at", null)
      .limit(6),
    supabase
      .from("reservations")
      .select("id, date, status, client_name, fields(name)")
      .ilike("client_name", term)
      .order("created_at", { ascending: false })
      .limit(6),
  ]);

  let profiles = profilesRes.data || [];
  if (profilesRes.error) {
    const retry = await supabase.from("profiles").select("id, name, phone, role").limit(80);
    profiles = retry.data || [];
  }

  const matchedProfiles = profiles.filter((p) =>
    matchesSearch(p.name, needle) || matchesSearch(p.phone, needle),
  );

  const users = matchedProfiles
    .filter((p) => p.role !== "owner" && p.role !== "super_admin")
    .slice(0, 6);
  const owners = matchedProfiles
    .filter((p) => p.role === "owner")
    .slice(0, 6);

  let fields = fieldsRes.data || [];
  if (fieldsRes.error) {
    const retry = await supabase
      .from("fields")
      .select("id, name, adress, field_source, status")
      .ilike("name", term)
      .is("deleted_at", null)
      .limit(6);
    fields = retry.data || [];
  }

  return {
    users,
    fields,
    bookings: bookingsRes.data || [],
    owners,
  };
};

// Données pour le centre de notifications admin
export const getAdminNotificationFeed = async () => {
  const [pendingBookingsRes, newUsersRes, recentLogsRes] = await Promise.all([
    supabase
      .from("reservations")
      .select("id, date, status, client_name, created_at, fields(name)")
      .in("status", ["En attente", "En attente de paiement"])
      .order("created_at", { ascending: false })
      .limit(8),
    supabase
      .from("profiles")
      .select("id, name, role, created_at")
      .order("created_at", { ascending: false })
      .limit(5),
    getRecentAdminLogs(5),
  ]);

  const notifications = [];

  (pendingBookingsRes.data || []).forEach((b) => {
    notifications.push({
      id: `booking-${b.id}`,
      type: "booking",
      title: "Réservation en attente",
      message: `${b.client_name || "Client"} — ${b.fields?.name || "Terrain"}`,
      createdAt: b.created_at,
      link: "/admin/reservations",
      meta: b.status,
    });
  });

  const weekAgo = Date.now() - 7 * 86400000;
  (newUsersRes.data || []).forEach((u) => {
    if (new Date(u.created_at).getTime() >= weekAgo) {
      notifications.push({
        id: `user-${u.id}`,
        type: "user",
        title: "Nouvel utilisateur",
        message: `${u.name || "Sans nom"} (${u.role})`,
        createdAt: u.created_at,
        link: "/admin/utilisateurs",
        meta: u.role,
      });
    }
  });

  (recentLogsRes || []).slice(0, 3).forEach((log) => {
    notifications.push({
      id: `log-${log.id}`,
      type: "log",
      title: "Action admin",
      message: `${log.action} — ${log.profiles?.name || "Admin"}`,
      createdAt: log.created_at,
      link: "/admin",
      meta: log.target_table,
    });
  });

  return notifications.sort(
    (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
  );
};

