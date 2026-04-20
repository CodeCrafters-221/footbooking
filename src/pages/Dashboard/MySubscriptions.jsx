import React, { useState, useEffect, useMemo } from "react";
import { useDashboard } from "../../context/DashboardContext";
import { generateTicket } from "../../utils/ticketGenerator";
import { AvailabilityService } from "../../services/AvailabilityService";
import { toast } from "react-toastify";

// Helper local pour normalisation
const normalizeStatus = (status) => (status || "").toLowerCase();

const getStatusColor = (status) => {
  const s = normalizeStatus(status);
  if (s === "payé" || s === "confirmé" || s === "active" || s === "success")
    return "text-green-500 bg-green-500/10 border-green-500/20";
  if (s === "annulé") return "text-red-500 bg-red-500/10 border-red-500/20";
  return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
};

const MySubscriptions = () => {
  const {
    subscriptions = [],
    isLoadingSubscriptions,
    updateSubscriptionStatus,
    archivedSubIds = [],
    toggleArchiveSubscription,
    fields,
    addOnSiteSubscription,
  } = useDashboard();

  const DAYS = [
    { id: "Lundi", label: "Lun" },
    { id: "Mardi", label: "Mar" },
    { id: "Mercredi", label: "Mer" },
    { id: "Jeudi", label: "Jeu" },
    { id: "Vendredi", label: "Ven" },
    { id: "Samedi", label: "Sam" },
    { id: "Dimanche", label: "Dim" },
  ];

  const emptySubForm = () => ({
    firstName: "",
    lastName: "",
    phone: "",
    fieldId: "",
    dayOfWeek: "",
    startTime: "",
    endTime: "",
    duration: "1",
    startDate: new Date().toISOString().split("T")[0],
    endDate: "",
    months: "1",
    amount: "",
  });

  const [showSubModal, setShowSubModal] = useState(false);
  const [subForm, setSubForm] = useState(emptySubForm());
  const [loadingSubmit, setLoadingSubmit] = useState(false);
  const [fieldAvailability, setFieldAvailability] = useState([]);
  const [loadingAvailability, setLoadingAvailability] = useState(false);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [fieldFilter, setFieldFilter] = useState("Tous les terrains");
  const [statusFilter, setStatusFilter] = useState("Tous les statuts");
  const [showArchived, setShowArchived] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  // Load field weekly availability (days) when fieldId changes
  useEffect(() => {
    if (!subForm.fieldId) {
      setFieldAvailability([]);
      setAvailableSlots([]);
      setSubForm((prev) => ({ ...prev, dayOfWeek: "", startTime: "", endTime: "", amount: "" }));
      return;
    }
    setLoadingAvailability(true);
    AvailabilityService.getFieldAvailability(subForm.fieldId)
      .then((data) => setFieldAvailability(data || []))
      .catch((err) => {
        console.error("[MySubscriptions] availability error:", err);
        setFieldAvailability([]);
      })
      .finally(() => setLoadingAvailability(false));
  }, [subForm.fieldId]);

  // Load hourly slots (like MyReservations) when fieldId + dayOfWeek + startDate change
  useEffect(() => {
    if (!subForm.fieldId || !subForm.dayOfWeek || !subForm.startDate) {
      setAvailableSlots([]);
      setSubForm((prev) => ({ ...prev, startTime: "", endTime: "" }));
      return;
    }
    // Find the next occurrence of the selected day from startDate
    const DAY_NUM = { Lundi: 1, Mardi: 2, Mercredi: 3, Jeudi: 4, Vendredi: 5, Samedi: 6, Dimanche: 0 };
    const targetDay = DAY_NUM[subForm.dayOfWeek];
    const base = new Date(subForm.startDate);
    let diff = (targetDay - base.getDay() + 7) % 7;
    if (diff === 0) diff = 0; // same day is ok
    const checkDate = new Date(base);
    checkDate.setDate(base.getDate() + diff);
    const dateStr = checkDate.toISOString().split("T")[0];

    setLoadingSlots(true);
    setSubForm((prev) => ({ ...prev, startTime: "", endTime: "" }));
    AvailabilityService.getAvailableSlots(subForm.fieldId, dateStr, parseFloat(subForm.duration || "1"))
      .then((slots) => {
        // Deduplicate by time
        const seen = new Set();
        setAvailableSlots(slots.filter((s) => { if (seen.has(s.time)) return false; seen.add(s.time); return true; }));
      })
      .catch((err) => { console.error("[MySubscriptions] slots error:", err); setAvailableSlots([]); })
      .finally(() => setLoadingSlots(false));
  }, [subForm.fieldId, subForm.dayOfWeek, subForm.startDate, subForm.duration]);

  // Auto-calc amount and endDate
  useEffect(() => {
    if (subForm.fieldId && subForm.startDate && subForm.months) {
      const field = fields?.find((f) => String(f.id) === String(subForm.fieldId));
      const basePrice = field?.price || 0;
      
      // Calculate End Date (total sessions = months * 4)
      const totalSessions = parseInt(subForm.months) * 4;
      const start = new Date(subForm.startDate);
      const end = new Date(start);
      end.setDate(start.getDate() + (totalSessions - 1) * 7);
      const calculatedEndDate = end.toISOString().split("T")[0];

      // Calculate Amount
      let calculatedAmount = "";
      if (subForm.duration && totalSessions > 0) {
        calculatedAmount = (basePrice * parseFloat(subForm.duration) * totalSessions).toFixed(0);
      }

      setSubForm(prev => ({ 
        ...prev, 
        endDate: calculatedEndDate,
        amount: calculatedAmount || prev.amount 
      }));
    }
  }, [subForm.fieldId, subForm.startDate, subForm.months, subForm.duration, fields]);

  // Derive available days from the weekly availability
  const DAY_NUMBER = { Lundi: 1, Mardi: 2, Mercredi: 3, Jeudi: 4, Vendredi: 5, Samedi: 6, Dimanche: 0 };
  const DAY_LABELS = { 1: "Lundi", 2: "Mardi", 3: "Mercredi", 4: "Jeudi", 5: "Vendredi", 6: "Samedi", 0: "Dimanche" };

  const availableDayNumbers = useMemo(
    () => [...new Set(fieldAvailability.map((a) => a.day_of_week))],
    [fieldAvailability]
  );

  const handleSubFormChange = (key, value) =>
    setSubForm((prev) => ({ ...prev, [key]: value }));



  const handleAddSubscription = async () => {
    const { firstName, lastName, phone, fieldId, dayOfWeek, startTime, endTime, startDate, endDate, amount } = subForm;
    if (!firstName || !lastName || !phone || !fieldId || !dayOfWeek || !startTime || !endTime || !startDate || !endDate) {
      toast.error("Veuillez remplir tous les champs obligatoires (*)");
      return;
    }
    setLoadingSubmit(true);
    try {
      // ─── CHECK OVERLAPS FOR ALL SESSIONS ───
      const totalSessions = parseInt(subForm.months || "1") * 4;
      const start = new Date(startDate);
      
      for (let i = 0; i < totalSessions; i++) {
        const sessionDate = new Date(start);
        sessionDate.setDate(start.getDate() + i * 7);
        const dateStr = sessionDate.toISOString().split("T")[0];
        
        const overlapResult = await AvailabilityService.checkOverlap(
          fieldId,
          dateStr,
          startTime,
          endTime
        );
        
        if (!overlapResult.available) {
          throw new Error(`Conflit le ${dateStr} : ${overlapResult.reason}`);
        }
      }

      await addOnSiteSubscription({
        fieldId: String(fieldId),
        clientName: `${firstName.trim()} ${lastName.trim()}`,
        clientPhone: phone.trim(),
        dayOfWeek: DAY_NUMBER[dayOfWeek],
        startTime,
        endTime,
        startDate,
        endDate: subForm.endDate,
        months: parseInt(subForm.months),
        amount: Number(amount) || 0,
        reservationType: "subscription",
      });
      setSubForm(emptySubForm());
      setShowSubModal(false);
      toast.success("Abonnement sur site ajouté avec succès !");
    } catch (err) {
      toast.error(err?.message || "Erreur lors de l'ajout.");
    } finally {
      setLoadingSubmit(false);
    }
  };


  const filteredSubscriptions = useMemo(() => {
    return subscriptions.filter((sub) => {
      const matchesField =
        fieldFilter === "Tous les terrains" || sub?.fieldName === fieldFilter;
      const matchesStatus =
        statusFilter === "Tous les statuts" ||
        normalizeStatus(sub?.status) === normalizeStatus(statusFilter);
      const isArchived = archivedSubIds.includes(String(sub.id));
      if (showArchived && !isArchived) return false;
      if (!showArchived && isArchived) return false;
      return matchesField && matchesStatus && !isArchived;
    });
  }, [subscriptions, fieldFilter, statusFilter, showArchived, archivedSubIds]);

  const totalPages = Math.ceil(filteredSubscriptions.length / itemsPerPage);
  const paginatedSubscriptions = useMemo(() => {
    return filteredSubscriptions.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage,
    );
  }, [filteredSubscriptions, currentPage]);

  const handleDownloadTicket = (booking) => {
    generateTicket(booking);
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    setLoadingAction(bookingId);
    try {
      await updateSubscriptionStatus(bookingId, newStatus);
      toast.success(`Abonnement mis à jour : ${newStatus}`);
    } catch (error) {
      toast.error(`Échec : ${error.message}`);
    } finally {
      setLoadingAction(null);
    }
  };

  if (isLoadingSubscriptions) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center gap-4">
        <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-primary font-bold text-sm uppercase tracking-widest">
          Chargement des abonnements...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6 md:gap-8 relative pb-20">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#f27f0d]/10 rounded-lg">
              <span className="material-symbols-outlined text-[#f27f0d] text-2xl">
                autorenew
              </span>
            </div>
            <h2 className="text-white text-2xl md:text-3xl font-bold">
              Mes Abonnements
            </h2>
          </div>
          <p className="text-[#cbad90] text-xs md:text-sm mt-1">
            Gérez vos clients réguliers et leurs créneaux hebdomadaires
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowSubModal(true)}
            className="bg-primary text-[#231a10] px-3 md:px-4 py-2.5 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(242,127,13,0.4)] transition-all flex items-center gap-2 active:scale-95 shadow-lg text-sm flex-shrink-0"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            <span className="hidden sm:inline">Abonnement sur site</span>
          </button>
          <select
            value={fieldFilter}
            onChange={(e) => {
              setFieldFilter(e.target.value);
              setCurrentPage(1);
            }}
            className="bg-[#2c241b] text-[#cbad90] border border-[#493622] rounded-xl px-3 md:px-4 py-2.5 text-sm outline-none focus:border-primary flex-1 min-w-0 transition-all"
          >
            <option>Tous les terrains</option>
            {[
              ...new Set(
                subscriptions.map((r) => r?.fieldName).filter(Boolean),
              ),
            ].map((name) => (
              <option key={name}>{name}</option>
            ))}
          </select>

          <button
            onClick={() => {
              setShowArchived(!showArchived);
              setCurrentPage(1);
            }}
            className={`size-10 md:size-11 flex items-center justify-center rounded-xl border transition-all flex-shrink-0 ${
              showArchived
                ? "bg-primary text-[#231a10] border-primary"
                : "bg-[#2c241b] text-[#cbad90] border-[#493622] hover:border-primary/50"
            }`}
            title={showArchived ? "Voir les actifs" : "Voir les archives"}
          >
            <span className="material-symbols-outlined text-[20px]">
              {showArchived ? "visibility" : "inventory_2"}
            </span>
          </button>
        </div>
      </div>

      {/* Liste des Abonnements en Grille (Cards) */}
      <div className="grid grid-cols-1 md:grid-cols-2  gap-6">
        {paginatedSubscriptions.length === 0 ? (
          <div className="col-span-full py-20 bg-[#2c241b]/50 border-2 border-dashed border-[#493622] rounded-3xl flex flex-col items-center justify-center text-center px-6">
            <div className="size-20 rounded-full bg-[#493622]/40 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl text-[#5d452b]">
                autorenew
              </span>
            </div>
            <h3 className="text-white font-bold text-xl">Aucun abonnement</h3>
            <p className="text-[#cbad90] mt-1">
              Gérez vos clients fidèles et leurs revenus récurrents.
            </p>
          </div>
        ) : (
          paginatedSubscriptions.map((booking) => {
            const status = normalizeStatus(booking.status);
            const isActive = ["payé", "confirmé", "active"].includes(status);
            const isLoading = loadingAction === booking.id;

            return (
              <div
                key={booking.id}
                className={`bg-[#2c241b] rounded-3xl border border-[#493622] hover:border-primary/50 transition-all group overflow-hidden ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
              >
                <div className="p-6 flex flex-col gap-5">
                  {/* Header Card */}
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <div className="size-12 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-lg border border-primary/20">
                        {booking.clientName?.substring(0, 2).toUpperCase()}
                      </div>
                      <div className="flex flex-col">
                        <h4 className="text-white font-bold leading-tight group-hover:text-primary transition-colors">
                          {booking.clientName}
                        </h4>
                        <p className="text-[#cbad90] text-xs opacity-70">
                          {booking.clientPhone}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getStatusColor(booking.status)}`}
                    >
                      {booking.status}
                    </span>
                  </div>

                  {/* Infos Terrain/Temps */}
                  <div className="bg-[#231a10]/50 rounded-2xl p-4 flex flex-col gap-3 border border-[#493622]/50">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-lg">
                        stadium
                      </span>
                      <p className="text-white text-sm font-medium">
                        {booking.fieldName}
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-primary text-lg">
                        schedule
                      </span>
                      <div>
                        <p className="text-white text-sm font-bold uppercase tracking-wider leading-none">
                          {DAY_LABELS[booking.dayOfWeek] || "Hebdomadaire"}
                        </p>
                        <p className="text-[#cbad90] text-xs mt-1">
                          {booking.time}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Dates de validité */}
                  <p className="text-[10px] text-[#cbad90] font-bold uppercase tracking-widest px-1">
                    Valide du{" "}
                    {booking.startDate
                      ? new Date(booking.startDate).toLocaleDateString()
                      : "..."}{" "}
                    au{" "}
                    {booking.endDate
                      ? new Date(booking.endDate).toLocaleDateString()
                      : "..."}
                  </p>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex gap-2">
                      <ActionButtons
                        booking={booking}
                        isLoading={isLoading}
                        onStatusChange={handleStatusChange}
                        onDownload={handleDownloadTicket}
                        onArchive={toggleArchiveSubscription}
                        archivedIds={archivedSubIds}
                      />
                    </div>
                    {status !== "annulé" &&
                      !archivedSubIds.includes(String(booking.id)) && (
                        <button
                          onClick={() =>
                            handleStatusChange(booking.id, "Annulé")
                          }
                          className="px-4 py-2 bg-red-500/10 text-red-500 text-[11px] font-black uppercase tracking-wider rounded-xl border border-red-500/20 hover:bg-red-500 hover:text-white transition-all active:scale-95"
                        >
                          Annuler
                        </button>
                      )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-6 mt-4">
          <button
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="size-12 rounded-xl border border-[#493622] bg-[#2c241b] text-white flex items-center justify-center hover:border-primary disabled:opacity-30 transition-all shadow-lg"
          >
            <span className="material-symbols-outlined">chevron_left</span>
          </button>

          <div className="flex items-center gap-2">
            <span className="text-primary font-black text-lg">
              {currentPage}
            </span>
            <span className="text-[#cbad90] font-bold text-xs uppercase tracking-widest">
              / {totalPages}
            </span>
          </div>

          <button
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="size-12 rounded-xl border border-[#493622] bg-[#2c241b] text-white flex items-center justify-center hover:border-primary disabled:opacity-30 transition-all shadow-lg"
          >
            <span className="material-symbols-outlined">chevron_right</span>
          </button>
        </div>
      )}

      {/* ── Modal Abonnement sur site ───────────────────────────────── */}
      {showSubModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1e160f] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[92vh] flex flex-col border border-[#493622] shadow-2xl">

            {/* Header */}
            <div className="flex-none px-4 md:px-6 pt-4 md:pt-6 pb-4 border-b border-[#493622] flex justify-between items-center">
              <div>
                <h3 className="text-white text-lg md:text-xl font-black italic">Abonnement sur site</h3>
                <p className="text-[#cbad90] text-xs md:text-sm mt-0.5">Enregistrer un client abonné sur place</p>
              </div>
              <button
                onClick={() => setShowSubModal(false)}
                className="size-10 flex items-center justify-center rounded-xl bg-[#2c241b] text-[#cbad90] hover:text-white hover:bg-[#3d2e1e] transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-5 flex flex-col gap-4">
              {/* Prénom & Nom */}
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-[#cbad90] text-xs font-bold uppercase tracking-wider mb-2">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={subForm.firstName}
                    onChange={(e) => handleSubFormChange("firstName", e.target.value)}
                    placeholder="Ex: Moussa"
                    className="w-full bg-[#2c241b] text-white border border-[#493622] rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[#cbad90] text-xs font-bold uppercase tracking-wider mb-2">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input type="text" value={subForm.lastName}
                    onChange={(e) => handleSubFormChange("lastName", e.target.value)}
                    placeholder="Ex: Diallo"
                    className="w-full bg-[#2c241b] text-white border border-[#493622] rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                  />
                </div>
              </div>

              {/* Téléphone */}
              <div>
                <label className="block text-[#cbad90] text-xs font-bold uppercase tracking-wider mb-2">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <input type="tel" value={subForm.phone}
                  onChange={(e) => handleSubFormChange("phone", e.target.value)}
                  placeholder="Ex: +221 77 000 00 00"
                  className="w-full bg-[#2c241b] text-white border border-[#493622] rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>

              {/* Terrain */}
              <div>
                <label className="block text-[#cbad90] text-xs font-bold uppercase tracking-wider mb-2">
                  Terrain <span className="text-red-500">*</span>
                </label>
                <select value={subForm.fieldId}
                  onChange={(e) => handleSubFormChange("fieldId", e.target.value)}
                  className="w-full bg-[#2c241b] text-white border border-[#493622] rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                >
                  <option value="">-- Sélectionner un terrain --</option>
                  {fields?.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              {/* Jour de la semaine */}
              <div>
                <label className="block text-[#cbad90] text-xs font-bold uppercase tracking-wider mb-2">
                  Jour hebdomadaire <span className="text-red-500">*</span>
                </label>
                {loadingAvailability ? (
                  <div className="flex items-center gap-3 py-4 justify-center border-2 border-dashed border-[#493622] rounded-xl">
                    <div className="size-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                    <p className="text-[#cbad90] text-sm">Chargement des disponibilités...</p>
                  </div>
                ) : !subForm.fieldId ? (
                  <div className="text-center py-4 border-2 border-dashed border-[#493622] rounded-xl">
                    <p className="text-[#5d452b] text-sm">Sélectionnez un terrain d'abord</p>
                  </div>
                ) : availableDayNumbers.length === 0 ? (
                  <div className="text-center py-4 border-2 border-dashed border-red-500/30 rounded-xl bg-red-500/5">
                    <p className="text-red-400 text-sm">Aucune disponibilité configurée pour ce terrain</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-7 gap-1">
                    {DAYS.map((d) => {
                      const isAvailable = availableDayNumbers.includes(DAY_NUMBER[d.id]);
                      return (
                        <button key={d.id} type="button"
                          disabled={!isAvailable}
                          onClick={() => handleSubFormChange("dayOfWeek", d.id)}
                          className={`py-2.5 rounded-xl text-xs font-bold transition-all border ${
                            !isAvailable
                              ? "bg-[#1a1208] border-[#2c241b] text-white/20 cursor-not-allowed"
                              : subForm.dayOfWeek === d.id
                                ? "bg-primary text-[#231a10] border-primary shadow-[0_0_10px_rgba(242,127,13,0.3)]"
                                : "bg-[#2c241b] text-[#cbad90] border-[#493622] hover:border-primary/50"
                          }`}
                        >{d.label}</button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Durée de la séance */}
                <div className="mb-4">
                  <label className="block text-[#cbad90] text-xs font-bold uppercase tracking-wider mb-2">
                    Durée de la séance <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {["1", "1.5", "2", "3"].map((d) => (
                      <button key={d} type="button"
                        onClick={() => handleSubFormChange("duration", d)}
                        className={`py-2 px-1 rounded-xl text-xs font-bold transition-all border ${
                          subForm.duration === d
                            ? "bg-primary text-[#231a10] border-primary shadow-[0_0_10px_rgba(242,127,13,0.3)]"
                            : "bg-[#2c241b] text-[#cbad90] border-[#493622] hover:border-primary/50"
                        }`}
                      >{d === "1.5" ? "1h30" : `${d}h`}</button>
                   ))}
                 </div>
               </div>

               {/* Créneau horaire — affiché uniquement quand un jour est choisi */}
              {subForm.dayOfWeek && (
                <div>
                  <label className="block text-[#cbad90] text-xs font-bold uppercase tracking-wider mb-2">
                    Créneau horaire <span className="text-red-500">*</span>
                  </label>
                  {loadingSlots ? (
                    <div className="flex items-center gap-3 py-4 justify-center border-2 border-dashed border-[#493622] rounded-xl">
                      <div className="size-4 border-2 border-primary/20 border-t-primary rounded-full animate-spin" />
                      <p className="text-[#cbad90] text-sm">Vérification des disponibilités...</p>
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-center py-4 border-2 border-dashed border-red-500/30 rounded-xl bg-red-500/5">
                      <p className="text-red-400 text-sm">Aucun créneau disponible pour ce jour</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-4 sm:grid-cols-4 gap-2">
                      {availableSlots.map((slot) => (
                        <button key={slot.time} type="button"
                          disabled={!slot.available}
                          onClick={() => {
                            const end = AvailabilityService.calculateEndTime(slot.time, subForm.duration);
                            setSubForm((prev) => ({ ...prev, startTime: slot.time, endTime: end }));
                          }}
                          className={`relative py-2.5 rounded-xl text-sm font-bold transition-all border ${
                            !slot.available
                              ? "bg-[#1a1208] border-[#2c241b] text-white/20 cursor-not-allowed overflow-hidden"
                              : subForm.startTime === slot.time
                                ? "bg-primary text-[#231a10] border-primary shadow-[0_0_12px_rgba(242,127,13,0.4)] scale-105"
                                : "bg-[#2c241b] text-white border-[#493622] hover:border-primary/50"
                          }`}
                        >
                          {slot.time}
                          {!slot.available && (
                            <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                              <div className="w-full h-[1.5px] bg-red-500/40 -rotate-12" />
                            </div>
                          )}
                        </button>
                      ))}
                    </div>
                  )}
                  {subForm.startTime && (
                    <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between">
                      <span className="text-[#cbad90] text-sm">Créneau sélectionné :</span>
                      <span className="text-primary font-bold">{subForm.startTime}</span>
                    </div>
                  )}
                </div>
              )}

              {/* Durée de l'abonnement */}
              <div>
                <label className="block text-[#cbad90] text-xs font-bold uppercase tracking-wider mb-2">
                  Durée de l'abonnement <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
                  {[1, 2, 4, 6, 12].map((m) => (
                    <button key={m} type="button"
                      onClick={() => handleSubFormChange("months", m.toString())}
                      className={`py-2 px-1 rounded-xl text-[10px] sm:text-xs font-bold transition-all border ${
                        subForm.months === m.toString()
                          ? "bg-primary text-[#231a10] border-primary shadow-[0_0_10px_rgba(242,127,13,0.3)]"
                          : "bg-[#2c241b] text-[#cbad90] border-[#493622] hover:border-primary/50"
                      }`}
                    >{m} {m === 1 ? "mois" : "mois"}</button>
                  ))}
                </div>
                <p className="text-[10px] text-[#5d452b] mt-1.5 italic">
                  Chaque mois contient exactement 4 sessions (Total : {parseInt(subForm.months) * 4} séances)
                </p>
              </div>

              {/* Période de validité */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-[#cbad90] text-xs font-bold uppercase tracking-wider mb-2">
                    Date début <span className="text-red-500">*</span>
                  </label>
                  <input type="date" value={subForm.startDate}
                    onChange={(e) => handleSubFormChange("startDate", e.target.value)}
                    className="w-full bg-[#2c241b] text-white border border-[#493622] rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[#cbad90] text-xs font-bold uppercase tracking-wider mb-2">
                    Date fin (Calculée)
                  </label>
                  <input type="date" value={subForm.endDate} readOnly
                    className="w-full bg-[#1a1208] text-[#cbad90] border border-[#493622]/50 rounded-xl px-4 py-3 text-sm outline-none cursor-not-allowed"
                  />
                </div>
              </div>

              {/* Montant */}
              <div>
                <label className="block text-[#cbad90] text-xs font-bold uppercase tracking-wider mb-2">
                  Prix Total de l'abonnement (CFA)
                </label>
                <div className="w-full bg-[#1a1208] text-primary border border-[#493622]/50 rounded-xl px-4 py-3 text-sm font-bold flex items-center justify-between">
                  <span>{subForm.amount ? `${Number(subForm.amount).toLocaleString()} FCFA` : "— Sélectionnez un créneau"}</span>
                  <span className="material-symbols-outlined text-xs opacity-60">lock</span>
                </div>
                {subForm.amount && (
                  <p className="text-[10px] text-[#5d452b] mt-1.5 italic">
                    Calculé sur la base de {parseInt(subForm.months) * 4} séances.
                  </p>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex-none px-4 md:px-6 py-4 md:py-5 border-t border-[#493622] flex gap-3">
              <button
                onClick={() => setShowSubModal(false)}
                className="flex-1 py-3 rounded-xl border border-[#493622] text-[#cbad90] font-bold text-sm hover:bg-[#2c241b] transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleAddSubscription}
                disabled={loadingSubmit}
                className="flex-1 py-3 rounded-xl bg-primary text-[#231a10] font-black text-sm hover:shadow-[0_0_20px_rgba(242,127,13,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
              >
                {loadingSubmit ? (
                  <>
                    <div className="size-4 border-2 border-[#231a10]/30 border-t-[#231a10] rounded-full animate-spin" />
                    Enregistrement...
                  </>
                ) : (
                  <>
                    <span className="material-symbols-outlined text-lg">check_circle</span>
                    Confirmer
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Helper Components
const StatusTag = ({ status }) => (
  <span
    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] md:text-xs font-bold border ${
      status === "Payé" || status === "Confirmé"
        ? "bg-green-500/10 text-green-500 border-green-500/20"
        : status === "Annulé"
          ? "bg-red-500/10 text-red-500 border-red-500/20"
          : "bg-yellow-500/10 text-yellow-500 border-yellow-500/20"
    }`}
  >
    <span
      className={`size-1.5 rounded-full ${status === "Payé" || status === "Confirmé" ? "bg-green-500" : status === "Annulé" ? "bg-red-500" : "bg-yellow-500"}`}
    ></span>
    {status}
  </span>
);

const ActionButtons = ({
  booking,
  isLoading,
  onStatusChange,
  onDownload,
  onArchive,
  archivedIds,
}) => (
  <>
    {!isLoading &&
      (normalizeStatus(booking.status) === "payé" ||
        normalizeStatus(booking.status) === "confirmé" ||
        normalizeStatus(booking.status) === "active") && (
        <button
          onClick={() => onDownload(booking)}
          className="size-8 flex items-center justify-center rounded-lg bg-[#493622] hover:bg-primary/20 text-[#cbad90] hover:text-primary transition-colors"
          title="Télécharger le contrat/ticket"
        >
          <span className="material-symbols-outlined text-[18px] md:text-[20px]">
            download
          </span>
        </button>
      )}
    {!isLoading && normalizeStatus(booking.status) !== "confirmé" && normalizeStatus(booking.status) !== "payé" && (
      <button
        onClick={() => onStatusChange(booking.id, "Confirmé")}
        className="size-8 flex items-center justify-center rounded-lg bg-green-500/10 hover:bg-green-500/20 text-green-500 transition-all shadow-lg border border-green-500/30"
        title="Confirmer"
      >
        <span className="material-symbols-outlined text-[18px] md:text-[20px]">
          check_circle
        </span>
      </button>
    )}
    <button
      onClick={() => onArchive(booking.id)}
      className={`size-8 flex items-center justify-center rounded-lg transition-all ${
        archivedIds.includes(String(booking.id))
          ? "bg-[#f27f0d]/20 text-[#f27f0d]"
          : "bg-[#493622] hover:bg-[#5d452b] text-[#cbad90] hover:text-white"
      }`}
    >
      <span className="material-symbols-outlined text-[18px] md:text-[20px]">
        {archivedIds.includes(String(booking.id))
          ? "visibility"
          : "visibility_off"}
      </span>
    </button>
  </>
);


export default MySubscriptions;
