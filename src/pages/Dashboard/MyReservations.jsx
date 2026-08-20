import React, { useState, useEffect, useMemo } from "react";
import { useDashboard } from "../../context/DashboardContext";
import { generateTicket } from "../../utils/ticketGenerator";
import { AvailabilityService } from "../../services/AvailabilityService";
import { isSubscription } from "../../utils/dateTime";
import { toast } from "react-toastify";
import ReportModal from "../../components/ReportModal";
import { ReportService } from "../../services/ReportService";

const normalizeStatus = (status) => (status || "").toLowerCase();
const getStatusColor = (status) => {
  const s = normalizeStatus(status);
  if (s === "payé" || s === "confirmé" || s === "active")
    return "text-green-500 bg-green-500/10 border-green-500/20";
  if (s === "annulé") return "text-red-500 bg-red-500/10 border-red-500/20";
  return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
};

const MyReservations = () => {
  const {
    isLoadingReservations,
    updateReservationStatus,
    archivedIds = [],
    reservations,
    fields,
    addOnSiteReservation,
    toggleArchiveReservation,
    highlightedReservationId,
  } = useDashboard();

  const [fieldFilter, setFieldFilter] = useState("Tous les terrains");
  const [showArchived, setShowArchived] = useState(false);
  const [loadingAction, setLoadingAction] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [showOnSiteModal, setShowOnSiteModal] = useState(false);
  const [reportBooking, setReportBooking] = useState(null);
  const [onSiteForm, setOnSiteForm] = useState({
    firstName: "",
    lastName: "",
    phone: "",
    fieldId: "",
    date: new Date().toISOString().split("T")[0],
    duration: "1",
    timeSlot: "",
    amount: "",
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const itemsPerPage = 6;

  useEffect(() => {
    const fetchSlots = async () => {
      if (!onSiteForm.date || !onSiteForm.fieldId) {
        setAvailableSlots([]);
        return;
      }
      setLoadingSlots(true);
      try {
        const slots = await AvailabilityService.getAvailableSlots(
          onSiteForm.fieldId,
          onSiteForm.date,
          parseFloat(onSiteForm.duration || "1")
        );
        setAvailableSlots(slots);
        
        if (onSiteForm.timeSlot) {
          const stillValid = slots.find(s => s.time === onSiteForm.timeSlot && s.available);
          if (!stillValid) setOnSiteForm(prev => ({ ...prev, timeSlot: "" }));
        }
      } catch (err) {
        console.error("Error fetching slots", err);
      } finally {
        setLoadingSlots(false);
      }
    };
    fetchSlots();
  }, [onSiteForm.date, onSiteForm.fieldId, onSiteForm.duration]);

  useEffect(() => {
    if (onSiteForm.fieldId) {
      const field = fields?.find(f => String(f.id) === String(onSiteForm.fieldId));
      if (field && field.price) {
        const basePrice = field.price || 0;
        const total = basePrice * parseFloat(onSiteForm.duration || "1");
        setOnSiteForm(prev => ({ ...prev, amount: total.toString() }));
      }
    }
  }, [onSiteForm.fieldId, onSiteForm.duration, fields]);

  const filteredReservations = useMemo(() => {
    return reservations.filter((r) => {
      // ✅ Séparation Match Unique vs Abonnements via helper centralisé
      if (isSubscription(r)) return false;

      const matchesField =
        fieldFilter === "Tous les terrains" || r.fieldName === fieldFilter;
      const isArchived = archivedIds.includes(String(r.id));

      return showArchived
        ? matchesField && isArchived
        : matchesField && !isArchived;
    });
  }, [reservations, fieldFilter, showArchived, archivedIds]);

  const totalPages = Math.ceil(filteredReservations.length / itemsPerPage);
  const paginatedReservations = useMemo(() => {
    return filteredReservations.slice(
      (currentPage - 1) * itemsPerPage,
      currentPage * itemsPerPage,
    );
  }, [filteredReservations, currentPage]);

  const handleDownloadTicket = (booking) => generateTicket(booking);



  const handleOnSiteFormChange = (field, value) => {
    setOnSiteForm((prev) => ({ ...prev, [field]: value }));
  };

  const calculateEndTime = (startTime, durationHours) => {
    if (!startTime) return "";
    const [hours, minutes] = startTime.split(":").map(Number);
    const date = new Date(2000, 0, 1, hours, minutes);
    const durationInMinutes = Math.round(Number(durationHours) * 60);
    date.setMinutes(date.getMinutes() + durationInMinutes);
    const h = String(date.getHours()).padStart(2, "0");
    const m = String(date.getMinutes()).padStart(2, "0");
    return `${h}:${m}`;
  };

  const handleAddOnSiteReservation = async () => {
    // Validation du formulaire
    if (
      !onSiteForm.firstName ||
      !onSiteForm.lastName ||
      !onSiteForm.phone ||
      !onSiteForm.fieldId ||
      !onSiteForm.timeSlot
    ) {
      toast.error("Veuillez remplir tous les champs obligatoires (*)");
      return;
    }

    const endTime = calculateEndTime(
      onSiteForm.timeSlot,
      parseFloat(onSiteForm.duration)
    );

    if (!endTime) {
      toast.error("Impossible de calculer l'heure de fin. Vérifiez le créneau.");
      return;
    }

    setLoadingAction("onsite");
    try {
      // ─── STICK OVERLAP CHECK ───
      const overlapResult = await AvailabilityService.checkOverlap(
        onSiteForm.fieldId,
        onSiteForm.date,
        onSiteForm.timeSlot,
        endTime
      );

      if (!overlapResult.available) {
        throw new Error(overlapResult.reason);
      }

      // console.log("[MyReservations] Submitting onsite reservation:", {
      //   fieldId: onSiteForm.fieldId,
      //   date: onSiteForm.date,
      //   startTime: onSiteForm.timeSlot,
      //   endTime,
      //   amount: Number(onSiteForm.amount),
      //   clientName: `${onSiteForm.firstName.trim()} ${onSiteForm.lastName.trim()}`,
      //   clientPhone: onSiteForm.phone.trim(),
      // });

      await addOnSiteReservation({
        fieldId: String(onSiteForm.fieldId),
        date: onSiteForm.date,
        startTime: onSiteForm.timeSlot,
        endTime,
        amount: Number(onSiteForm.amount),
        clientName: `${onSiteForm.firstName.trim()} ${onSiteForm.lastName.trim()}`,
        clientPhone: onSiteForm.phone.trim(),
      });

      // Réinitialiser le formulaire
      setOnSiteForm({
        firstName: "",
        lastName: "",
        phone: "",
        fieldId: "",
        date: new Date().toISOString().split("T")[0],
        duration: "1",
        timeSlot: "",
        amount: "",
      });
      setShowOnSiteModal(false);
      toast.success("Réservation sur site ajoutée avec succès !");
    } catch (error) {
      console.error("[MyReservations] Onsite reservation failed:", error);
      toast.error(error?.message || "Erreur lors de l'ajout de la réservation.");
    } finally {
      setLoadingAction(null);
    }
  };

  const handleStatusChange = async (id, status) => {
    setLoadingAction(id);
    try {
      await updateReservationStatus(id, status);
      toast.success(`Mis à jour : ${status}`);
    } catch (e) {
      toast.error(e.message);
    } finally {
      setLoadingAction(null);
    }
  };

  const handleReportClient = async ({ type, description }) => {
    if (!reportBooking) return;
    try {
      await ReportService.createReport({
        report_type: "comportement",
        subject: type,
        description: `Réservation ${reportBooking.id} — ${reportBooking.fieldName}${reportBooking.date ? ` — ${reportBooking.date}` : ""}${reportBooking.time ? ` — ${reportBooking.time}` : ""}. ${description}`,
        target_type: "utilisateur",
        target_label: reportBooking.clientName || "Client",
      });
      toast.success("Signalement envoyé ! Notre équipe va l'examiner.");
      setReportBooking(null);
    } catch (err) {
      console.error("Erreur lors du signalement:", err);
      toast.error(
        err?.message ||
          "Une erreur est survenue lors de l'envoi du signalement.",
      );
    }
  };

  if (isLoadingReservations) {
    return (
      <div className="h-[400px] flex flex-col items-center justify-center gap-4">
        <div className="size-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
        <p className="text-primary font-bold text-sm uppercase tracking-widest">
          Chargement des réservations...
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8 pb-20 relative">

      {/* Header & Filtres */}
      <div className="flex flex-col gap-4">
        <div className="flex flex-col">
          <h2 className="text-white text-2xl md:text-3xl font-black italic tracking-tight">
            Mes Réservations
          </h2>
          <p className="text-[#cbad90] text-xs md:text-sm mt-1">
            Gérez vos créneaux et accueillez vos joueurs
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowOnSiteModal(true)}
            className="bg-primary text-[#231a10] px-3 md:px-4 py-2.5 rounded-xl font-bold hover:shadow-[0_0_20px_rgba(242,127,13,0.4)] transition-all flex items-center gap-2 active:scale-95 shadow-lg text-sm flex-shrink-0"
          >
            <span className="material-symbols-outlined text-lg">add</span>
            <span className="hidden sm:inline">Réservation sur site</span>
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
            {[...new Set(reservations.map((r) => r.fieldName))].map((name) => (
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
            title={showArchived ? "Voir les actives" : "Voir les archives"}
          >
            <span className="material-symbols-outlined text-[20px]">
              {showArchived ? "visibility" : "inventory_2"}
            </span>
          </button>
        </div>
      </div>

      {/* Liste des Réservations */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {paginatedReservations.length === 0 ? (
          <div className="col-span-full py-20 bg-[#2c241b]/50 border-2 border-dashed border-[#493622] rounded-3xl flex flex-col items-center justify-center text-center px-6">
            <div className="size-20 rounded-full bg-[#493622]/40 flex items-center justify-center mb-4">
              <span className="material-symbols-outlined text-4xl text-[#5d452b]">
                event_busy
              </span>
            </div>
            <h3 className="text-white font-bold text-xl">Aucune réservation</h3>
            <p className="text-[#cbad90] mt-1">
              Vous n'avez pas de réservations correspondant à ces critères.
            </p>
          </div>
        ) : (
          paginatedReservations.map((booking) => {
            const status = normalizeStatus(booking.status);
            const isActive = ["payé", "confirmé", "active"].includes(status);
            const isLoading = loadingAction === booking.id;
            const isHighlighted = highlightedReservationId === booking.id;

            return (
              <div
                key={booking.id}
                className={`bg-[#2c241b] rounded-3xl border transition-all group overflow-hidden ${
                  isHighlighted
                    ? "border-primary/80 shadow-[0_0_20px_rgba(242,127,13,0.4)] animate-pulse"
                    : "border-[#493622] hover:border-primary/50"
                } ${isLoading ? "opacity-50 pointer-events-none" : ""}`}
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
                        <p className="text-[#cbad90] text-[11px] font-mono opacity-60">
                          ID: {booking.id.toString().substring(0, 8)}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`px-2 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider border ${getStatusColor(booking.status)}`}
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
                      <p className="text-white text-sm font-medium">
                        {booking.time || "Créneau non défini"}
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-between pt-2">
                    <div className="flex gap-2">
                      {isActive && (
                        <button
                          onClick={() => handleDownloadTicket(booking)}
                          className="size-10 flex items-center justify-center rounded-xl bg-[#493622] text-[#cbad90] hover:text-white hover:bg-primary transition-all"
                          title="Télécharger le ticket"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            download
                          </span>
                        </button>
                      )}
                      <button
                        onClick={() => toggleArchiveReservation(booking.id)}
                        className={`size-10 flex items-center justify-center rounded-xl transition-all ${
                          archivedIds.includes(String(booking.id))
                            ? "bg-primary text-[#231a10]"
                            : "bg-[#493622] text-[#cbad90] hover:bg-[#5d452b] hover:text-white"
                        }`}
                        title="Archiver / Désarchiver"
                      >
                        <span className="material-symbols-outlined text-[20px]">
                          {archivedIds.includes(String(booking.id))
                            ? "visibility"
                            : "archive"}
                        </span>
                      </button>
                      {status === "payé" && (
                        <button
                          onClick={() => setReportBooking(booking)}
                          className="size-10 flex items-center justify-center rounded-xl bg-red-500/10 text-red-400 border border-red-500/20 hover:text-white hover:bg-red-500/70 transition-all"
                          title="Signaler le client"
                        >
                          <span className="material-symbols-outlined text-[20px]">
                            flag
                          </span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {status !== "confirmé" &&
                        status !== "payé" &&
                        status !== "annulé" &&
                        !archivedIds.includes(String(booking.id)) && (
                          <button
                            onClick={() =>
                              handleStatusChange(booking.id, "Confirmé")
                            }
                            className="px-4 py-2 bg-green-500/10 text-green-500 text-[11px] font-black uppercase tracking-wider rounded-xl border border-green-500/20 hover:bg-green-500 hover:text-white transition-all active:scale-95"
                          >
                            Valider
                          </button>
                        )}

                      {status !== "annulé" &&
                        !archivedIds.includes(String(booking.id)) && (
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

      {/* Modal Réservation sur site */}
      {showOnSiteModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-[#1e160f] rounded-t-3xl sm:rounded-3xl w-full sm:max-w-lg max-h-[92vh] flex flex-col border border-[#493622] shadow-2xl">
            {/* Header */}
            <div className="flex-none px-4 md:px-6 pt-4 md:pt-6 pb-4 border-b border-[#493622] flex justify-between items-center">
              <div>
                <h3 className="text-white text-lg md:text-xl font-black italic">Réservation sur site</h3>
                <p className="text-[#cbad90] text-xs md:text-sm mt-0.5">Enregistrer un client présent sur place</p>
              </div>
              <button
                onClick={() => setShowOnSiteModal(false)}
                className="size-10 flex items-center justify-center rounded-xl bg-[#2c241b] text-[#cbad90] hover:text-white hover:bg-[#3d2e1e] transition-all"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-4 md:py-5 flex flex-col gap-4">
              {/* Nom & Prénom */}
              <div className="grid grid-cols-1 xs:grid-cols-2 sm:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-[#cbad90] text-xs font-bold uppercase tracking-wider mb-2">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={onSiteForm.firstName}
                    onChange={(e) => handleOnSiteFormChange("firstName", e.target.value)}
                    placeholder="Ex: Moussa"
                    className="w-full bg-[#2c241b] text-white border border-[#493622] rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[#cbad90] text-xs font-bold uppercase tracking-wider mb-2">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={onSiteForm.lastName}
                    onChange={(e) => handleOnSiteFormChange("lastName", e.target.value)}
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
                <input
                  type="tel"
                  value={onSiteForm.phone}
                  onChange={(e) => handleOnSiteFormChange("phone", e.target.value)}
                  placeholder="Ex: +221 77 000 00 00"
                  className="w-full bg-[#2c241b] text-white border border-[#493622] rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                />
              </div>

              {/* Terrain */}
              <div>
                <label className="block text-[#cbad90] text-xs font-bold uppercase tracking-wider mb-2">
                  Terrain <span className="text-red-500">*</span>
                </label>
                <select
                  value={onSiteForm.fieldId}
                  onChange={(e) => handleOnSiteFormChange("fieldId", e.target.value)}
                  className="w-full bg-[#2c241b] text-white border border-[#493622] rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                >
                  <option value="">-- Sélectionner un terrain --</option>
                  {fields?.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              {/* Date & Durée */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
                <div>
                  <label className="block text-[#cbad90] text-xs font-bold uppercase tracking-wider mb-2">
                    Date <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="date"
                    value={onSiteForm.date}
                    onChange={(e) => handleOnSiteFormChange("date", e.target.value)}
                    className="w-full bg-[#2c241b] text-white border border-[#493622] rounded-xl px-4 py-3 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary/30 transition-all"
                  />
                </div>
                <div>
                  <label className="block text-[#cbad90] text-xs font-bold uppercase tracking-wider mb-2">
                    Durée <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {["1", "1.5", "2", "3"].map((d) => (
                      <button
                        key={d}
                        type="button"
                        onClick={() => handleOnSiteFormChange("duration", d)}
                        className={`py-2.5 rounded-xl text-sm font-bold transition-all border ${
                          onSiteForm.duration === d
                            ? "bg-primary text-[#231a10] border-primary shadow-[0_0_10px_rgba(242,127,13,0.3)]"
                            : "bg-[#2c241b] text-[#cbad90] border-[#493622] hover:border-primary/50"
                        }`}
                      >
                        {d === "1.5" ? "1h30" : `${d}h`}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Créneaux */}
              <div>
                <label className="block text-[#cbad90] text-xs font-bold uppercase tracking-wider mb-2">
                  Créneau horaire <span className="text-red-500">*</span>
                </label>
                {!onSiteForm.fieldId || !onSiteForm.date ? (
                  <div className="text-center py-6 border-2 border-dashed border-[#493622] rounded-xl">
                    <p className="text-[#5d452b] text-sm">Sélectionnez un terrain et une date</p>
                  </div>
                ) : loadingSlots ? (
                  <div className="flex items-center gap-3 py-6 justify-center">
                    <div className="size-5 border-2 border-primary/20 border-t-primary rounded-full animate-spin"></div>
                    <p className="text-[#cbad90] text-sm">Vérification des disponibilités...</p>
                  </div>
                ) : availableSlots.length === 0 ? (
                  <div className="text-center py-6 border-2 border-dashed border-red-500/30 rounded-xl bg-red-500/5">
                    <p className="text-red-400 text-sm">Aucun créneau disponible pour ce jour</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                    {availableSlots.map((slot) => (
                      <button
                        key={slot.time}
                        type="button"
                        disabled={!slot.available}
                        onClick={() => handleOnSiteFormChange("timeSlot", slot.time)}
                        className={`relative py-2.5 rounded-xl text-sm font-bold transition-all border ${
                          !slot.available
                            ? "bg-[#1a1208] border-[#2c241b] text-white/20 cursor-not-allowed overflow-hidden"
                            : onSiteForm.timeSlot === slot.time
                              ? "bg-primary text-[#231a10] border-primary shadow-[0_0_12px_rgba(242,127,13,0.4)] scale-105"
                              : "bg-[#2c241b] text-white border-[#493622] hover:border-primary/50"
                        }`}
                      >
                        {slot.time}
                        {!slot.available && (
                          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-full h-[1.5px] bg-red-500/40 -rotate-12"></div>
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}

                {/* Récap créneau */}
                {onSiteForm.timeSlot && (
                  <div className="mt-3 p-3 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between">
                    <span className="text-[#cbad90] text-sm">Créneau :</span>
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold">{onSiteForm.timeSlot}</span>
                      <span className="material-symbols-outlined text-primary text-sm">arrow_forward</span>
                      <span className="text-primary font-bold">{calculateEndTime(onSiteForm.timeSlot, parseFloat(onSiteForm.duration))}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Montant */}
              <div>
                <label className="block text-[#cbad90] text-xs font-bold uppercase tracking-wider mb-2">
                  Prix total (CFA)
                </label>
                <div className="w-full bg-[#1a1208] text-primary border border-[#493622]/50 rounded-xl px-4 py-3 text-sm font-bold flex items-center justify-between">
                  <span>{onSiteForm.amount ? `${Number(onSiteForm.amount).toLocaleString()} FCFA` : "— Sélectionnez un terrain"}</span>
                  <span className="material-symbols-outlined text-xs opacity-60">lock</span>
                </div>
              </div>
            </div>

            {/* Footer */}
            <div className="flex-none px-4 md:px-6 py-4 md:py-5 border-t border-[#493622] flex gap-3">
              <button
                onClick={() => setShowOnSiteModal(false)}
                className="flex-1 py-3 rounded-xl border border-[#493622] text-[#cbad90] font-bold text-sm hover:bg-[#2c241b] transition-all"
              >
                Annuler
              </button>
              <button
                onClick={handleAddOnSiteReservation}
                disabled={loadingAction === "onsite"}
                className="flex-1 py-3 rounded-xl bg-primary text-[#231a10] font-black text-sm hover:shadow-[0_0_20px_rgba(242,127,13,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 active:scale-95"
              >
                {loadingAction === "onsite" ? (
                  <>
                    <div className="size-4 border-2 border-[#231a10]/30 border-t-[#231a10] rounded-full animate-spin"></div>
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

      {reportBooking && (
        <ReportModal
          isOpen
          onClose={() => setReportBooking(null)}
          title="Signaler un client"
          subtitle={`Signalement concernant « ${reportBooking.clientName || "le client"} » après le service`}
          typeOptions={[
            {
              value: "Non-respect des règles",
              label: "Non-respect des règles",
            },
            {
              value: "Comportement inapproprié",
              label: "Comportement inapproprié",
            },
            { value: "Dommages matériels", label: "Dommages matériels" },
            {
              value: "Annulation de dernière minute",
              label: "Annulation de dernière minute",
            },
            { value: "Autre", label: "Autre" },
          ]}
          onSubmit={handleReportClient}
        />
      )}
    </div>
  );
};

export default MyReservations;
