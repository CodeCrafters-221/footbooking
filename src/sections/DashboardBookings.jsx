import React, { useState, useMemo, useCallback } from "react";
import { useDashboard } from "../context/DashboardContext";
import { useNavigate } from "react-router-dom";
import { formatDisplayDate } from "../utils/dateTime";

/**
 * Sous-composant mémoïsé pour éviter les re-rendus inutiles de la liste
 */
const BookingItem = React.memo(({ booking }) => {
  const { month, day } = formatDisplayDate(
    booking.originalDate || booking.createdAt || booking.date,
  );

  const statusColors = {
    active: "text-green-500",
    Confirmé: "text-green-500",
    Payé: "text-green-500",
    Annulé: "text-red-500",
    Expiré: "text-red-500",
    default: "text-yellow-500",
  };

  const statusBg = statusColors[booking.status] || statusColors.default;
  const dotBg = statusBg.replace("text-", "bg-");

  return (
    <div className="px-3 py-2.5 hover:bg-[#493622]/40 rounded-xl transition-colors cursor-pointer group border border-transparent hover:border-[#493622]">
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center justify-center bg-[#231a10] border border-[#493622] text-[#f27f0d] rounded-lg w-12 h-12 shrink-0 group-hover:bg-[#f27f0d] group-hover:text-[#231a10] transition-colors">
          <span className="text-[10px] font-bold uppercase">{month}</span>
          <span className="text-lg font-black leading-none">{day}</span>
        </div>
        <div className="flex flex-col flex-1 overflow-hidden">
          <div className="flex justify-between items-center">
            <h4 className="text-white font-bold text-sm truncate">
              {booking.clientName}
            </h4>
            <span className="text-[#f27f0d] text-[10px] font-black px-2 py-0.5 rounded-md bg-[#f27f0d]/10 ml-2 shrink-0">
              {booking.time || booking.startTime}
            </span>
          </div>
          <p className="text-[#cbad90] text-xs truncate mt-0.5">
            {booking.fieldName || booking.terrainName}
          </p>
          <div className="flex items-center gap-1.5 mt-1.5">
            <span className={`size-1.5 rounded-full ${dotBg}`}></span>
            <span className={`text-[10px] font-bold uppercase ${statusBg}`}>
              {booking.status}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
});

BookingItem.displayName = "BookingItem";

const DashboardBookings = () => {
  const { reservations } = useDashboard();
  const navigate = useNavigate();
  const [filterStatus, setFilterStatus] = useState("Tout"); // Tout, En attente, Confirmé, Annulé

  const displayReservations = useMemo(() => {
    let filtered = reservations;
    if (filterStatus === "En attente") {
      filtered = reservations.filter((r) =>
        String(r.status || "")
          .toLowerCase()
          .includes("attente"),
      );
    } else if (filterStatus === "Confirmé") {
      filtered = reservations.filter((r) => {
        const statusLower = String(r.status || "").toLowerCase();
        return (
          statusLower.includes("confirmé") ||
          statusLower.includes("payé") ||
          statusLower.includes("active")
        );
      });
    } else if (filterStatus === "Annulé") {
      filtered = reservations.filter((r) => {
        const statusLower = String(r.status || "").toLowerCase();
        return (
          statusLower.includes("annulé") ||
          statusLower.includes("canceled") ||
          statusLower.includes("expiré")
        );
      });
    }
    return filtered.slice(0, 4); // Limit to 4 to save vertical space
  }, [reservations, filterStatus]);

  return (
    <div className="bg-[#2c241b] rounded-2xl border border-[#493622] h-full flex flex-col max-h-[420px]">
      <div className="p-4 sm:p-5 border-b border-[#493622] shrink-0">
        <div className="flex items-center justify-between pointer-events-none">
          <h3 className="text-white text-lg font-black">
            Réservations
          </h3>
          <span className="text-xs font-bold text-[#cbad90] bg-[#231a10] px-2 py-1 rounded-md border border-[#493622]">
            {displayReservations.length} Récents
          </span>
        </div>
        
        {/* Pilles de filtres (remplace le bouton obscur) */}
        <div className="flex items-center gap-2 mt-4 overflow-x-auto hide-scrollbar pb-1">
          {["Tout", "En attente", "Confirmé", "Annulé"].map((f) => (
            <button
               key={f}
               onClick={() => setFilterStatus(f)}
               className={`px-3 py-1.5 text-[11px] font-bold rounded-full whitespace-nowrap transition-all border ${
                 filterStatus === f 
                   ? 'bg-[#f27f0d] text-[#231a10] border-[#f27f0d]' 
                   : 'bg-[#231a10] text-[#cbad90] border-[#493622] hover:border-[#f27f0d]/50 hover:text-white'
               }`}
            >
               {f}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex flex-col p-2 overflow-y-auto custom-scrollbar flex-1">
        {displayReservations.length > 0 ? (
          displayReservations.map((booking) => (
            <BookingItem key={booking.id} booking={booking} />
          ))
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-center p-4 min-h-[150px]">
            <span className="material-symbols-outlined text-4xl text-[#493622] mb-2">event_busy</span>
            <p className="text-sm font-medium text-[#cbad90]">Aucune réservation trouvée</p>
          </div>
        )}

        <div className="p-2 mt-auto shrink-0">
          <button
            onClick={() => navigate("/dashboard/calendar")}
            className="w-full py-2.5 rounded-xl border border-[#493622] text-[#cbad90] text-sm font-bold hover:bg-[#493622] hover:text-white transition-all shadow-sm flex items-center justify-center gap-2"
          >
            <span className="material-symbols-outlined text-[18px]">calendar_month</span>
            Voir le calendrier
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardBookings;
