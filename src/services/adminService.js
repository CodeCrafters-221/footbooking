import { supabase } from "./supabaseClient";

// Log admin action
export const logAdminAction = async (action, targetTable, targetId, details = {}) => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  
  await supabase.from("admin_logs").insert([{
    admin_id: user.id,
    action,
    target_table: targetTable,
    target_id: targetId,
    details
  }]);
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

// Obtenir les statistiques du dashboard
export const getAdminStats = async () => {
  try {
    const [fieldsRes, usersRes, bookingsRes] = await Promise.all([
      supabase.from("fields").select("id, field_source", { count: "exact" }),
      supabase.from("profiles").select("id, role", { count: "exact" }),
      supabase.from("reservations").select("id, total_price, status", { count: "exact" })
    ]);

    const totalFields = fieldsRes.count || 0;
    const totalUsers = usersRes.count || 0;
    const totalBookings = bookingsRes.count || 0;
    
    // Calcul revenu total (somme des prix des réservations confirmées ou complétées)
    let totalRevenue = 0;
    if (bookingsRes.data) {
      totalRevenue = bookingsRes.data
        .filter(b => b.status === "Confirmé" || b.status === "completed")
        .reduce((sum, b) => sum + (b.total_price || 0), 0);
    }

    return {
      totalFields,
      totalUsers,
      totalBookings,
      totalRevenue
    };
  } catch (error) {
    console.error("Error fetching admin stats", error);
    return { totalFields: 0, totalUsers: 0, totalBookings: 0, totalRevenue: 0 };
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

  const descriptionText = terrainData.telephone 
    ? `${terrainData.description || ""}\n\n📞 WhatsApp/Contact: ${terrainData.telephone}`.trim()
    : (terrainData.description || "");

  const { data: terrain, error } = await supabase.from("fields").insert({
    name: terrainData.name,
    adress: terrainData.adress,
    price_per_hour: parseFloat(terrainData.price_per_hour) || 0,
    pelouse: terrainData.pelouse || "Synthétique",
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
    .update({ role: "user" })
    .eq("id", ownerId);
  if (error) throw error;
  await logAdminAction("suspended_owner", "profiles", ownerId);
};

// Réactiver un propriétaire suspendu
export const reactivateOwner = async (userId) => {
  const { error } = await supabase
    .from("profiles")
    .update({ role: "owner" })
    .eq("id", userId);
  if (error) throw error;
  await logAdminAction("reactivated_owner", "profiles", userId);
};

