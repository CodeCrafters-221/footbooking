import React, { useState } from "react";
import { useDashboard } from "../../context/DashboardContext";
import { isSubscription, isPaidStatus } from "../../utils/dateTime";
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  MapPin,
  RefreshCcw,
} from "lucide-react";

// Helper for local YYYY-MM-DD
const getLocalYYYYMMDD = (d) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

const CalendarMatch = () => {
  const { reservations, subscriptions } = useDashboard();
  const [selectedDate, setSelectedDate] = useState(new Date());

  // Formatter pour la date affichée
  const formatDate = (date) => {
    return new Intl.DateTimeFormat("fr-FR", {
      weekday: "long",
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(date);
  };

  const dailyReservations = (() => {
    const selectedDateStr = getLocalYYYYMMDD(selectedDate);
    const selectedDayOfWeek = selectedDate.getDay();

    // 1. Réservations uniques (Uniquement celles confirmées/payées)
    const singleMatches = (reservations || [])
      .filter((res) => {
        // Use res.originalDate as it retains the raw "YYYY-MM-DD" from Supabase
        const resDateStr = res.originalDate || res.date;
        return (
          resDateStr === selectedDateStr &&
          !isSubscription(res) &&
          isPaidStatus(res.status)
        );
      })
      .map((res) => ({ ...res, matchType: "single" }));

    // 2. Abonnements qui tombent ce jour-là (Uniquement ceux confirmés/payés)
    const subscriptionMatches = (subscriptions || [])
      .filter((sub) => {
        if (!isPaidStatus(sub.status)) return false;

        const startStr = sub.startDate;
        const endStr = sub.endDate;
        const withinRange = selectedDateStr >= startStr && selectedDateStr <= endStr;

        // Extract day of week from start date if sub.day_of_week is missing
        let subDay = sub.day_of_week;
        if (subDay === undefined) {
          const sd = new Date(startStr);
          subDay = sd.getDay();
        }

        return withinRange && selectedDayOfWeek === subDay;
      })
      .map((sub) => ({
        ...sub,
        id: sub.id || sub.subscription_id,
        matchType: "subscription",
      }));

    return [...singleMatches, ...subscriptionMatches].sort((a, b) => {
      // Sort by time
      const timeA = a.time || a.startTime || "";
      const timeB = b.time || b.startTime || "";
      return timeA.localeCompare(timeB);
    });
  })();

  const changeDate = (days) => {
    const next = new Date(selectedDate);
    next.setDate(selectedDate.getDate() + days);
    setSelectedDate(next);
  };

  return (
    <div className="flex flex-col gap-6 md:gap-8 pb-20">
      {/* Header Calendrier */}
      <div className="flex flex-col sm:flex-row justify-between sm:items-center bg-gradient-to-br from-[#2c241b] to-[#231a10] p-5 md:p-7 rounded-3xl border border-[#493622] shadow-xl gap-5">
        <div className="flex items-center gap-4">
          <div className="p-3.5 md:p-4 bg-primary/20 rounded-2xl shrink-0 shadow-inner border border-primary/20">
            <CalendarIcon className="text-primary w-6 h-6 md:w-7 md:h-7" />
          </div>
          <div className="min-w-0">
            <h2 className="text-white text-xl md:text-2xl font-black italic tracking-wide">
              Calendrier des Matchs
            </h2>
            <p className="text-[#cbad90] text-xs md:text-sm mt-1 truncate">
              Réservations et matchs prévus par jour.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-1 bg-[#1a1208]/80 p-2 rounded-2xl border border-[#493622]/80 backdrop-blur-sm sm:w-auto w-full shadow-inner">
          <button
            onClick={() => changeDate(-1)}
            className="p-3 bg-[#2c241b] hover:bg-primary text-[#cbad90] hover:text-[#231a10] rounded-xl transition-all shadow-sm active:scale-95"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <span className="text-white text-sm md:text-base font-bold px-4 flex-1 text-center min-w-[140px] capitalize">
            {formatDate(selectedDate)}
          </span>
          <button
            onClick={() => changeDate(1)}
            className="p-3 bg-[#2c241b] hover:bg-primary text-[#cbad90] hover:text-[#231a10] rounded-xl transition-all shadow-sm active:scale-95"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Liste des créneaux */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-5">
        {dailyReservations.length > 0 ? (
          dailyReservations.map((booking, idx) => {
            let startTimeDisplay = "N/A";
            let endTimeDisplay = null;

            if (booking.time) {
              if (booking.time.includes("-")) {
                const parts = booking.time.split("-").map(p => p.trim());
                startTimeDisplay = parts[0];
                endTimeDisplay = parts[1] || null;
              } else {
                startTimeDisplay = booking.time;
              }
            } else if (booking.startTime) {
              startTimeDisplay = booking.startTime;
              endTimeDisplay = booking.endTime || null;
            }

            const isSub = booking.matchType === "subscription";

            return (
              <div
                key={`${booking.id}-${idx}`}
                className="group relative bg-[#2c241b] border border-[#493622] hover:border-primary/50 overflow-hidden rounded-2xl transition-all shadow-lg hover:shadow-primary/10 flex flex-row items-stretch"
              >
                {/* Indicateur de type (ligne gauche) */}
                <div
                  className={`w-1.5 shrink-0 transition-colors ${
                    isSub ? "bg-primary" : "bg-[#493622] group-hover:bg-[#5d452b]"
                  }`}
                />

                {/* Bloc Heure (Gauche) Timeline design */}
                <div className="w-24 md:w-28 flex flex-col items-center justify-center py-4 px-2 border-r border-[#493622]/50 bg-[#231a10]/40 shrink-0 relative">
                  <div className="absolute top-1/2 -right-4 size-8 bg-primary/5 rounded-full blur-xl -translate-y-1/2"></div>
                  
                  <span className="text-white font-black text-lg md:text-xl tracking-tighter leading-none">
                    {startTimeDisplay}
                  </span>
                  
                  {endTimeDisplay ? (
                    <div className="flex flex-col items-center justify-center my-1.5">
                      <div className="w-0.5 h-1 bg-[#493622] rounded-full mb-0.5"></div>
                      <div className="w-0.5 h-1 bg-[#493622] rounded-full mb-0.5"></div>
                      <div className="w-1.5 h-1.5 bg-primary rounded-full shadow-[0_0_8px_rgba(242,127,13,0.6)]"></div>
                    </div>
                  ) : (
                    <Clock
                      className={`w-5 h-5 mt-2 transition-all opacity-50 ${
                        isSub ? "text-primary" : "text-[#cbad90] group-hover:text-primary"
                      }`}
                    />
                  )}

                  {endTimeDisplay && (
                    <span className="text-[#8c735a] font-bold text-[13px] md:text-sm tracking-tighter leading-none">
                      {endTimeDisplay}
                    </span>
                  )}
                </div>

                {/* Corps de la carte */}
                <div className="flex flex-col justify-between flex-1 p-3.5 md:p-4 min-w-0">
                  {/* En-tête : Nom et Statut */}
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex flex-col min-w-0">
                      <h3 className="text-white font-bold text-base md:text-lg truncate flex items-center gap-2">
                        <User className="w-4 h-4 text-primary shrink-0" />
                        <span className="truncate">{booking.clientName}</span>
                      </h3>
                      <p className="text-[#8c735a] text-[11px] font-mono mt-0.5 ml-6">
                        ID: {(booking.id || "").toString().substring(0, 8)}
                      </p>
                    </div>
                    <StatusBadge status={booking.status} />
                  </div>

                  {/* Bas : Terrain et Badge Type */}
                  <div className="flex items-end justify-between mt-3 gap-2">
                    <div className="flex items-center gap-2 bg-[#231a10] px-2.5 py-1.5 rounded-lg border border-[#493622]/50 max-w-[65%] sm:max-w-none">
                      <MapPin className="w-3.5 h-3.5 text-primary shrink-0" />
                      <span className="text-[#cbad90] text-xs md:text-sm font-medium truncate">
                        {booking.fieldName}
                      </span>
                    </div>

                    {isSub ? (
                      <div className="flex items-center gap-1 text-primary text-[9px] md:text-[10px] font-black uppercase tracking-widest bg-primary/10 px-2 py-1 rounded shrink-0">
                        <RefreshCcw className="w-3 h-3" />
                        <span className="hidden xs:inline">Abonnement</span>
                        <span className="xs:hidden">Abo</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-[#8c735a] text-[9px] md:text-[10px] font-black uppercase tracking-widest shrink-0">
                        <span className="size-1.5 bg-[#8c735a]/50 rounded-full"></span>
                        <span className="hidden xs:inline">Match Unique</span>
                        <span className="xs:hidden">Unique</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        ) : (
          <div className="col-span-full flex flex-col items-center justify-center py-24 bg-[#2c241b]/30 rounded-3xl border-2 border-dashed border-[#493622]">
            <div className="size-20 rounded-full bg-[#493622]/40 flex items-center justify-center mb-6 shadow-inner">
              <CalendarIcon className="w-10 h-10 text-[#5d452b]" />
            </div>
            <h3 className="text-white font-black text-2xl">Aucun match</h3>
            <p className="text-[#cbad90] text-base mt-2 max-w-xs text-center">
              Il n'y a pas de réservation ou d'abonnement prévu pour cette journée.
            </p>
            <button
              onClick={() => setSelectedDate(new Date())}
              className="mt-6 px-6 py-2.5 bg-primary/10 text-primary border border-primary/20 hover:bg-primary hover:text-[#231a10] rounded-xl font-bold transition-all"
            >
              Revenir à aujourd'hui
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

// Composants Badges internes pour un code plus propre et maintenable
const StatusBadge = ({ status }) => {
  const isPaid = isPaidStatus(status);
  const s = (status || "").toLowerCase();
  const isCancelled = s === "annulé" || s === "cancelled";

  if (isPaid) {
    return (
      <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-green-500/10 text-green-500 border border-green-500/20 shrink-0">
        Confirmé
      </span>
    );
  }
  if (isCancelled) {
    return (
      <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-red-500/10 text-red-500 border border-red-500/20 shrink-0">
        Annulé
      </span>
    );
  }
  return (
    <span className="px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-wider bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 shrink-0">
      {status || "En attente"}
    </span>
  );
};

export default CalendarMatch;
