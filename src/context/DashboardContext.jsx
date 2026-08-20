import {
  createContext,
  useContext,
  useState,
  useEffect,
  useMemo,
  useCallback,
} from "react";
import { supabase } from "../services/supabaseClient";
import { useAuth } from "./AuthContext";
import { toast } from "react-toastify";
import { ReservationService } from "../services/ReservationService";
import { TerrainService, uploadTerrainImage } from "../services/TerrainService";
import { getSafeErrorMessage } from "../utils/security";

import { isSubscription } from "../utils/dateTime";

const DashboardContext = createContext();

export const useDashboard = () => useContext(DashboardContext);

export const DashboardProvider = ({ children }) => {
  const { user } = useAuth();
  const [fields, setFields] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [reservationTypes, setReservationTypes] = useState([]);
  const [isLoadingFields, setIsLoadingFields] = useState(true);
  const [isLoadingReservations, setIsLoadingReservations] = useState(true);
  const [isLoadingSubscriptions, setIsLoadingSubscriptions] = useState(true);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [archivedIds, setArchivedIds] = useState([]);
  const [archivedSubIds, setArchivedSubIds] = useState([]);
  const [highlightedReservationId, setHighlightedReservationId] =
    useState(null);

  // --- PERSISTENCE: LOAD ---
  useEffect(() => {
    if (user) {
      const savedRes = localStorage.getItem(`archived_reservations_${user.id}`);
      const savedSub = localStorage.getItem(`archived_subscriptions_${user.id}`);
      if (savedRes) setArchivedIds(JSON.parse(savedRes));
      if (savedSub) setArchivedSubIds(JSON.parse(savedSub));
    }
  }, [user]);

  // --- PERSISTENCE: SAVE ---
  useEffect(() => {
    if (user && (archivedIds.length > 0 || archivedSubIds.length > 0)) {
      localStorage.setItem(`archived_reservations_${user.id}`, JSON.stringify(archivedIds));
      localStorage.setItem(`archived_subscriptions_${user.id}`, JSON.stringify(archivedSubIds));
    } else if (user) {
      // Handle the case where someone archives everything then unarchives everything (length 0)
      // but only if we have already "loaded" or if it's a deliberate clear.
      // To be safe, just always save if user exists, but we need to watch out for the initial mount.
      localStorage.setItem(`archived_reservations_${user.id}`, JSON.stringify(archivedIds));
      localStorage.setItem(`archived_subscriptions_${user.id}`, JSON.stringify(archivedSubIds));
    }
  }, [archivedIds, archivedSubIds, user]);

  // --- FETCH RESERVATION TYPES ---
  const fetchReservationTypes = useCallback(() => {
    // Note: table 'reservation_types' non existante en base, on utilise une liste fixe.
    setReservationTypes([
      { id: "single", label: "Match unique" },
      { id: "subscription", label: "Abonnement" },
      { id: "onsite", label: "Sur site (Manuel)" },
    ]);
  }, []);

  // --- FETCH FIELDS ---
  const fetchFields = useCallback(async () => {
    if (!user) return;
    setIsLoadingFields(true);
    try {
      const mappedFields = await TerrainService.getAllTerrains();
      // On filtre pour ne garder que ceux du propriétaire (sécurité supplémentaire avant RLS)
      setFields(mappedFields.filter(f => f.proprietaire_id === user.id));
    } catch (error) {
      console.error("Error fetching fields:", error.message);
      toast.error("Erreur lors de la récupération des terrains.");
    } finally {
      setIsLoadingFields(false);
    }
  }, [user]);

  // --- NOTIFICATIONS ---
  const processNotifications = (reservs, subs = []) => {
    const resNotifs = reservs
      .filter((r) => r.status === "En attente" && !isSubscription(r))
      .map((r) => ({
        id: r.id,
        title: "Nouvelle réservation",
        message: `${r.clientName} a réservé ${r.fieldName}`,
        time: r.time,
        date: r.date,
        status: r.status,
        type: "reservation",
        original: r,
      }));

    const subNotifs = subs
      .filter((s) => s.status === "En attente")
      .map((s) => ({
        id: s.id,
        title: "Nouvel Abonnement",
        message: `${s.clientName} s'est abonné à ${s.fieldName}`,
        time: s.time,
        date: "Hebdomadaire",
        status: s.status,
        type: "subscription",
        original: s,
      }));

    const activeNotifs = [...resNotifs, ...subNotifs].sort(
      (a, b) => new Date(b.original.createdAt) - new Date(a.original.createdAt),
    );

    setNotifications(activeNotifs);
    setUnreadCount(activeNotifs.length);
  };

  // --- FETCH RESERVATIONS & SUBSCRIPTIONS (with sync) ---
  const fetchReservations = useCallback(
    async (subsData = null) => {
      if (!user) return;
      setIsLoadingReservations(true);
      try {
        const mappedReservations = await ReservationService.getOwnerReservations();
        
        // On re-mappe pour le format du Dashboard (initiales, etc.)
        const dashboardReservations = mappedReservations.map(r => {
          const initials = (r.clientName || "CI")
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase();
          
          return {
            ...r,
            amount: r.price,
            fieldName: r.terrainName,
            initials,
            originalDate: r.date,
            date: new Date(r.date).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "short",
              year: "numeric",
            })
          };
        });

        setReservations(dashboardReservations);
        processNotifications(dashboardReservations, subsData || subscriptions);
      } catch (error) {
        console.error("Error fetching reservations:", error.message);
      } finally {
        setIsLoadingReservations(false);
      }
    },
    [user], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const fetchSubscriptions = useCallback(
    async (resData = null) => {
      if (!user) return;
      setIsLoadingSubscriptions(true);
      try {
        const mappedSubscriptions = await ReservationService.getOwnerSubscriptions(user.id);
        
        // On re-mappe pour le format du Dashboard (initiales, etc.)
        const dashboardSubscriptions = mappedSubscriptions.map(s => ({
          ...s,
          amount: s.price,
          fieldName: s.fieldName,
          initials: (s.clientName || "CI")
            .split(" ")
            .map((n) => n[0])
            .join("")
            .substring(0, 2)
            .toUpperCase()
        }));

        setSubscriptions(dashboardSubscriptions);
        // On évite d'utiliser 'reservations' du state directement ici pour éviter la boucle
        if (resData) processNotifications(resData, dashboardSubscriptions);
      } catch (error) {
        console.error("Error fetching subscriptions:", error.message);
      } finally {
        setIsLoadingSubscriptions(false);
      }
    },
    [user], // Removed reservations from deps
  );

  // --- INITIAL DATA FETCH ---
  useEffect(() => {
    if (!user) return;

    const loadData = async () => {
      try {
        setIsLoadingReservations(true);
        setIsLoadingSubscriptions(true);
        
        const [resData, subsData] = await Promise.all([
          ReservationService.getOwnerReservations(),
          ReservationService.getOwnerSubscriptions(user.id)
        ]);

        const formatRes = (r) => ({
          ...r,
          amount: r.price,
          fieldName: r.terrainName,
          initials: (r.clientName || "CI").split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase(),
          originalDate: r.date,
          date: new Date(r.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "numeric" })
        });

        const formatSub = (s) => ({
          ...s,
          amount: s.price,
          fieldName: s.fieldName,
          initials: (s.clientName || "CI").split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase()
        });

        const mappedRes = resData.map(formatRes);
        const mappedSub = subsData.map(formatSub);

        setReservations(mappedRes);
        setSubscriptions(mappedSub);
        processNotifications(mappedRes, mappedSub);
      } catch (err) {
        console.error("Erreur initialisation Dashboard:", err);
      } finally {
        setIsLoadingReservations(false);
        setIsLoadingSubscriptions(false);
      }
    };

    loadData();
    fetchFields();
    fetchReservationTypes();
  }, [user]); // Only run on user change

  // --- REALTIME SUBSCRIPTION ---
  useEffect(() => {
    if (!user) return;

    const channel = supabase
      .channel("dashboard-changes")
      .on("postgres_changes", { event: "*", schema: "public", table: "reservations" }, async (payload) => {
        if (payload.eventType === "INSERT") {
          toast.info("Nouvelle réservation détectée !");
        }
        await fetchReservations();
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "subscriptions" }, async (payload) => {
        if (payload.eventType === "INSERT") {
          toast.info("Nouvel abonnement détecté !");
        }
        await fetchSubscriptions();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [user, fetchReservations, fetchSubscriptions]);

  const addField = useCallback(
    async (newFieldData, imageFile) => {
      try {
        const field = await TerrainService.createTerrain(newFieldData, imageFile);
        await fetchFields();
        return field;
      } catch (error) {
        toast.error(`Erreur : ${error.message}`);
        throw error;
      }
    },
    [fetchFields],
  );

  const deleteField = useCallback(
    async (id) => {
      try {
        await TerrainService.deleteTerrain(id);
        setFields(fields.filter((f) => f.id !== id));
        toast.success("Terrain supprimé avec succès !");
      } catch (error) {
        toast.error(`Erreur lors de la suppression : ${getSafeErrorMessage(error)}`);
        throw error;
      }
    },
    [fields],
  );

  const updateField = useCallback(
    async (id, updatedAttributes) => {
      try {
        await TerrainService.updateTerrain(id, updatedAttributes);
        await fetchFields();
        toast.success("Terrain mis à jour !");
        return true;
      } catch (error) {
        toast.error(`Erreur : ${error.message}`);
        throw error;
      }
    },
    [fetchFields],
  );

  // --- RESERVATION ACTIONS ---
  const updateReservationStatus = useCallback(
    async (id, status) => {
      try {
        await ReservationService.updateStatus(id, status);
        toast.success("Statut mis à jour !");
        await fetchReservations();
        return true;
      } catch (error) {
        toast.error(`Erreur : ${error.message}`);
        throw error;
      }
    },
    [fetchReservations],
  );

  const updateSubscriptionStatus = useCallback(
    async (id, status) => {
      try {
        await ReservationService.updateSubscriptionStatus(id, status);
        toast.success("Abonnement mis à jour !");
        await fetchSubscriptions();
        await fetchReservations();
        return true;
      } catch (error) {
        toast.error(`Erreur : ${error.message}`);
        throw error;
      }
    },
    [fetchSubscriptions, fetchReservations],
  );

  const addOnSiteReservation = useCallback(
    async (data) => {
      try {
        await ReservationService.createOnsiteReservation({
          field_id: data.fieldId,
          date: data.date,
          start_time: data.startTime,
          end_time: data.endTime,
          total_price: Number(data.amount) || 0,
          client_name: data.clientName,
          client_phone: data.clientPhone,
          reservation_type: data.reservationType || "onsite",
        });

        await fetchReservations();
        toast.success("Réservation ajoutée !");
        return true;
      } catch (error) {
        toast.error(`Erreur : ${error.message}`);
        throw error;
      }
    },
    [fetchReservations],
  );

  const addManualReservation = addOnSiteReservation;

  const addOnSiteSubscription = useCallback(
    async (data) => {
      try {
        if (!data.fieldId) throw new Error("Aucun terrain sélectionné.");
        
        const newSub = await ReservationService.createSubscription({
          field_id: data.fieldId,
          client_name: data.clientName,
          client_phone: data.clientPhone,
          day_of_week: data.dayOfWeek,
          start_time: data.startTime,
          end_time: data.endTime,
          start_date: data.startDate,
          end_date: data.endDate,
          total_amount: Number(data.amount) || 0,
          status: "Confirmé",
        });

        if (newSub?.id) {
          const startDate = new Date(data.startDate);
          const totalSessions = (data.months || 1) * 4;
          const sessionPrice = (Number(data.amount) || 0) / totalSessions;

          // Création des sessions individuelles via OnSiteReservation pour valider la propriété
          for (let i = 0; i < totalSessions; i++) {
            const sessionDate = new Date(startDate);
            sessionDate.setDate(startDate.getDate() + i * 7);

            await ReservationService.createOnsiteReservation({
              field_id: data.fieldId,
              date: sessionDate.toISOString().split("T")[0],
              start_time: data.startTime,
              end_time: data.endTime,
              total_price: sessionPrice, // Prix au prorata de l'abonnement
              client_name: data.clientName,
              client_phone: data.clientPhone,
              reservation_type: "subscription",
              subscription_id: newSub.id,
            });
          }
        }

        await fetchSubscriptions();
        await fetchReservations();
        toast.success("Abonnement créé avec succès !");
        return true;
      } catch (error) {
        toast.error(`Erreur : ${error.message}`);
        throw error;
      }
    },
    [fetchSubscriptions, fetchReservations],
  );

  const toggleFieldStatus = useCallback(async () => {
    console.warn(
      "La fonctionnalité de désactivation n'est pas encore disponible en base de données.",
    );
    toast.info("La désactivation des terrains sera bientôt disponible.");
  }, []);

  // --- MODAL FUNCTIONS ---
  const openCreateModal = useCallback(() => setIsCreateModalOpen(true), []);
  const closeCreateModal = useCallback(() => setIsCreateModalOpen(false), []);
  const openEditModal = useCallback((field) => {
    setEditingField(field);
    setIsEditModalOpen(true);
  }, []);
  const closeEditModal = useCallback(() => {
    setEditingField(null);
    setIsEditModalOpen(false);
  }, []);

  // --- STATS & DATA PROCESSING ---
  const getStats = () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    // For weekly charts
    const startOfWeek = new Date(now);
    startOfWeek.setDate(
      now.getDate() - now.getDay() + (now.getDay() === 0 ? -6 : 1),
    );
    startOfWeek.setHours(0, 0, 0, 0);

    const days = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
    const attendanceData = days.map((day, index) => {
      const dayDate = new Date(startOfWeek);
      dayDate.setDate(startOfWeek.getDate() + index);
      const dateStrIso = dayDate.toISOString().split("T")[0];

      const count = reservations.filter(
        (r) => r.originalDate === dateStrIso && r.status !== "Annulé",
      ).length;

      return { name: day, players: count * 10 };
    });

    const weeklyRevenueData = [4, 3, 2, 1].map((weeksAgo) => {
      const start = new Date();
      start.setDate(now.getDate() - weeksAgo * 7);
      const end = new Date();
      end.setDate(now.getDate() - (weeksAgo - 1) * 7);

      const weeklyTotal = reservations.reduce((acc, r) => {
        const rDate = new Date(r.originalDate);
        if (
          rDate >= start &&
          rDate < end &&
          (r.status === "Payé" || r.status === "Confirmé")
        ) {
          return acc + Number(r.amount || 0);
        }
        return acc;
      }, 0);

      return { name: `Sem ${5 - weeksAgo}`, revenue: weeklyTotal };
    });

    const distribution = fields
      .map((f) => {
        const count = reservations.filter(
          (r) => r.fieldId === f.id && r.status !== "Annulé",
        ).length;
        return { name: f.name, value: count };
      })
      .filter((d) => d.value > 0);

    const hours = ["16h", "17h", "18h", "19h", "20h", "21h", "22h"];
    const hourlyData = hours.map((h) => {
      const count = reservations.filter(
        (r) => r.time.startsWith(h.substring(0, 2)) && r.status !== "Annulé",
      ).length;
      return { hour: h, count: count };
    });

    const todayStr = now.toISOString().split("T")[0];
    const todayObj = new Date(todayStr);

    const activeReservationsCount = reservations.filter(
      (r) => new Date(r.originalDate) >= todayObj && r.status !== "Annulé",
    ).length;

    const monthlyRevenue = reservations.reduce((acc, curr) => {
      const rDate = new Date(curr.originalDate);
      return (
        acc +
        (rDate >= startOfMonth &&
        (curr.status === "Payé" || curr.status === "Confirmé")
          ? Number(curr.amount || 0)
          : 0)
      );
    }, 0);

    const monthlyRevenueSubscriptions = subscriptions.reduce((acc, curr) => {
      const sDate = new Date(curr.createdAt);
      const isConfirmed = ["Confirmé", "active", "Payé", "En attente"].includes(
        curr.status,
      ); // Adjusted to include all revenue-generating statuses
      return (
        acc +
        (sDate >= startOfMonth && isConfirmed ? Number(curr.amount || 0) : 0)
      );
    }, 0);

    const uniqueClientsCount = new Set(
      reservations
        .filter((r) => r.status !== "Annulé")
        .map((r) => r.clientName)
        .concat(subscriptions.map((s) => s.clientName)), // Include clients from subscriptions
    ).size;

    return {
      totalFields: fields.length,
      activeReservations: activeReservationsCount,
      weeklyRevenue: monthlyRevenue, // Matching the existing key to avoid breaking Statistics.jsx
      totalClients: uniqueClientsCount,
      subscriptionRevenue: monthlyRevenueSubscriptions, // Added new metric
      occupancyRate:
        fields.length > 0
          ? `${Math.min(100, Math.round((activeReservationsCount / (fields.length * 5)) * 100))}%`
          : "0%",
      attendanceData,
      weeklyRevenueData,
      fieldDistributionData: distribution,
      hourlyAffluenceData: hourlyData,
    };
  };

  // (Archive loading handled by first useEffect at top of component)

  const toggleArchiveReservation = useCallback((id) => {
    const idStr = String(id);
    setArchivedIds((prev) => {
      const isArchived = prev.includes(idStr);
      return isArchived
        ? prev.filter((hid) => String(hid) !== idStr)
        : [...prev, idStr];
    });
  }, []);

  const toggleArchiveSubscription = useCallback((id) => {
    const idStr = String(id);
    setArchivedSubIds((prev) => {
      const isArchived = prev.includes(idStr);
      return isArchived
        ? prev.filter((hid) => String(hid) !== idStr)
        : [...prev, idStr];
    });
  }, []);

  // --- MARK NOTIFICATION AS READ ---
  const markNotificationAsRead = useCallback(
    (notificationId, redirectData = {}) => {
      setNotifications((prev) => prev.filter((n) => n.id !== notificationId));
      setUnreadCount((prev) => Math.max(0, prev - 1));

      // Highlight the reservation if provided
      if (redirectData.reservationId) {
        setHighlightedReservationId(redirectData.reservationId);
        // Auto-clear highlight after 3 seconds
        setTimeout(() => setHighlightedReservationId(null), 3000);
      }
    },
    [],
  );

  const uploadFieldImage = useCallback(
    async (fieldId, file) => {
      try {
        const fileExt = file.name.split(".").pop() || "jpg";
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("terrain-images")
          .upload(fileName, file);

        if (uploadError) throw uploadError;

        const {
          data: { publicUrl },
        } = supabase.storage.from("terrain-images").getPublicUrl(fileName);

        const { error: dbError } = await supabase.from("field_images").insert({
          terrain_id: fieldId,
          url_image: publicUrl,
        });

        if (dbError) throw dbError;

        await fetchFields();
        return publicUrl;
      } catch (error) {
        console.error("Error uploading image:", error.message);
        throw error;
      }
    },
    [fetchFields],
  );

  const uploadMultipleFieldImages = useCallback(
    async (fieldId, files) => {
      try {
        const uploadPromises = Array.from(files).map((file) =>
          uploadFieldImage(fieldId, file),
        );
        const urls = await Promise.all(uploadPromises);
        return urls;
      } catch (error) {
        console.error("Error uploading multiple images:", error.message);
        throw error;
      }
    },
    [uploadFieldImage],
  );

  const deleteFieldImage = useCallback(
    async (fieldId, imageUrl) => {
      try {
        // Extract filename from URL
        const urlParts = imageUrl.split("/");
        const fileName = urlParts[urlParts.length - 1];

        // 1. Delete from storage
        const { error: storageError } = await supabase.storage
          .from("terrain-images")
          .remove([fileName]);

        if (storageError) {
          console.warn("Storage delete error (continuing...):", storageError);
        }

        // 2. Delete from database
        const { error: dbError } = await supabase
          .from("field_images")
          .delete()
          .match({ url_image: imageUrl, terrain_id: fieldId });

        if (dbError) throw dbError;

        await fetchFields();
        return true;
      } catch (error) {
        console.error("Error deleting image:", error.message);
        throw error;
      }
    },
    [fetchFields],
  );

  const stats = useMemo(
    () => getStats(),
    [fields, reservations, subscriptions], // eslint-disable-line react-hooks/exhaustive-deps
  );

  const value = useMemo(
    () => ({
      fields,
      reservations,
      subscriptions,
      reservationTypes,
      stats,
      notifications,
      unreadCount,
      markNotificationAsRead,
      highlightedReservationId,
      archivedIds,
      toggleArchiveReservation,
      isLoadingFields,
      isLoadingReservations,
      isLoadingSubscriptions,
      isCreateModalOpen,
      openCreateModal,
      closeCreateModal,
      isEditModalOpen,
      editingField,
      openEditModal,
      closeEditModal,
      addField,
      deleteField,
      updateField,
      updateReservationStatus,
      updateSubscriptionStatus,
      addManualReservation,
      addOnSiteReservation,
      addOnSiteSubscription,
      toggleFieldStatus,
      fetchFields,
      fetchReservations,
      deleteFieldImage,
      uploadMultipleFieldImages,
      archivedSubIds,
      toggleArchiveSubscription,
    }),
    [
      fields,
      reservations,
      subscriptions,
      reservationTypes,
      stats,
      notifications,
      unreadCount,
      markNotificationAsRead,
      highlightedReservationId,
      archivedIds,
      toggleArchiveReservation,
      isLoadingFields,
      isLoadingReservations,
      isLoadingSubscriptions,
      isCreateModalOpen,
      openCreateModal,
      closeCreateModal,
      isEditModalOpen,
      editingField,
      openEditModal,
      closeEditModal,
      addField,
      deleteField,
      updateField,
      updateReservationStatus,
      updateSubscriptionStatus,
      addManualReservation,
      addOnSiteReservation,
      addOnSiteSubscription,
      toggleFieldStatus,
      fetchFields,
      deleteFieldImage,
      uploadMultipleFieldImages,
      archivedSubIds,
      toggleArchiveSubscription,
    ],
  );

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
};
