import { useState, useEffect } from "react";
import {
  Filter,
  Calendar,
  Clock,
  MapPin,
  User,
  CheckCircle,
  XCircle,
} from "lucide-react";
import { getAdminBookings, updateAdminBookingStatus } from "../../../services/adminService";
import { toast } from "react-toastify";
import ConfirmModal from "../../../components/Admin/ConfirmModal";

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState("all");
  const [actionLoading, setActionLoading] = useState(false);
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    booking: null,
    action: null,
  });
  const limit = 10;

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, count } = await getAdminBookings(page, limit, filter);
      setBookings(data || []);
      setTotalCount(count || 0);
    } catch {
      toast.error("Erreur lors du chargement des réservations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [page, filter]);

  const totalPages = Math.ceil(totalCount / limit);

  const openConfirm = (booking, action) => {
    setConfirmModal({ open: true, booking, action });
  };

  const closeConfirm = () => {
    setConfirmModal({ open: false, booking: null, action: null });
  };

  const handleConfirmAction = async () => {
    const { booking, action } = confirmModal;
    if (!booking || !action) return;

    const newStatus = action === "validate" ? "Confirmé" : "Annulé";
    setActionLoading(true);
    try {
      await updateAdminBookingStatus(booking.id, newStatus);
      setBookings((prev) =>
        prev.map((b) => (b.id === booking.id ? { ...b, status: newStatus } : b)),
      );
      toast.success(
        action === "validate"
          ? "Réservation validée avec succès"
          : "Réservation annulée",
      );
      closeConfirm();
    } catch (err) {
      toast.error(err.message || "Impossible de mettre à jour la réservation");
    } finally {
      setActionLoading(false);
    }
  };

  const canValidate = (status) =>
    status !== "Confirmé" && status !== "Payé" && status !== "Annulé";

  const canCancel = (status) => status !== "Annulé";

  const statusClass = (status) => {
    if (status === "Confirmé" || status === "Payé") {
      return "bg-green-500/10 text-green-400 border-green-500/20";
    }
    if (status === "Annulé") {
      return "bg-red-500/10 text-red-400 border-red-500/20";
    }
    return "bg-orange-500/10 text-orange-400 border-orange-500/20";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Réservations Globales</h1>
          <p className="text-[#cbad90] mt-1">
            Toutes les réservations de la plateforme. Total: {totalCount}
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#2c241b] p-4 rounded-2xl border border-[#493622]">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-5 h-5 text-[#cbad90]" />
          <select
            value={filter}
            onChange={(e) => {
              setFilter(e.target.value);
              setPage(1);
            }}
            className="bg-[#231a10] border border-[#493622] rounded-xl text-white text-sm py-2.5 px-4 focus:outline-none focus:border-primary cursor-pointer w-full md:w-auto"
          >
            <option value="all">Tous les statuts</option>
            <option value="Confirmé">Confirmées</option>
            <option value="En attente de paiement">En attente</option>
            <option value="En attente">En attente (court)</option>
            <option value="Annulé">Annulées</option>
          </select>
        </div>
      </div>

      <div className="bg-[#2c241b] border border-[#493622] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="bg-[#231a10]/50 border-b border-[#493622] text-[#cbad90] text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">Date & Heure</th>
                <th className="p-4 font-medium">Terrain</th>
                <th className="p-4 font-medium">Client</th>
                <th className="p-4 font-medium">Prix</th>
                <th className="p-4 font-medium">Statut</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#493622]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-4"><div className="h-6 w-32 bg-[#493622] rounded" /></td>
                    <td className="p-4"><div className="h-6 w-24 bg-[#493622] rounded" /></td>
                    <td className="p-4"><div className="h-6 w-32 bg-[#493622] rounded" /></td>
                    <td className="p-4"><div className="h-6 w-16 bg-[#493622] rounded" /></td>
                    <td className="p-4"><div className="h-6 w-20 bg-[#493622] rounded-full" /></td>
                    <td className="p-4"><div className="h-8 w-28 bg-[#493622] rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-[#cbad90]">
                    <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium text-white">Aucune réservation</p>
                    <p className="text-xs mt-1">Modifiez le filtre pour voir plus de résultats.</p>
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-[#493622]/30 transition-colors">
                    <td className="p-4">
                      <p className="text-white font-bold text-sm flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        {new Date(b.date).toLocaleDateString("fr-FR")}
                      </p>
                      <p className="text-[#cbad90] text-xs flex items-center gap-2 mt-1">
                        <Clock className="w-4 h-4" />
                        {b.start_time?.substring?.(0, 5) || b.start_time} -{" "}
                        {b.end_time?.substring?.(0, 5) || b.end_time}
                      </p>
                    </td>
                    <td className="p-4">
                      <span className="text-white font-medium text-sm flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-gray-400" />
                        {b.fields?.name || "Terrain inconnu"}
                      </span>
                    </td>
                    <td className="p-4">
                      <p className="text-white text-sm flex items-center gap-2">
                        <User className="w-4 h-4 text-gray-400" />
                        {b.client_name || (b.user_id ? "Client App" : "Inconnu")}
                      </p>
                      {b.client_phone && (
                        <p className="text-[#cbad90] text-xs mt-1 ml-6">{b.client_phone}</p>
                      )}
                    </td>
                    <td className="p-4 text-white font-bold text-sm">
                      {(b.total_price || 0).toLocaleString()} CFA
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold border ${statusClass(b.status)}`}
                      >
                        {b.status}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-end gap-2">
                        {canValidate(b.status) && (
                          <button
                            type="button"
                            onClick={() => openConfirm(b, "validate")}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20"
                            title="Valider"
                          >
                            <CheckCircle className="w-3.5 h-3.5" />
                            Valider
                          </button>
                        )}
                        {canCancel(b.status) && (
                          <button
                            type="button"
                            onClick={() => openConfirm(b, "cancel")}
                            className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                            title="Annuler"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            Annuler
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="p-4 border-t border-[#493622] flex items-center justify-between">
            <span className="text-sm text-[#cbad90]">
              Page {page} sur {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-[#493622] text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-[#5d452b] transition-colors"
              >
                Précédent
              </button>
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 bg-[#493622] text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-[#5d452b] transition-colors"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.open}
        title={
          confirmModal.action === "validate"
            ? "Valider la réservation"
            : "Annuler la réservation"
        }
        message={
          confirmModal.action === "validate"
            ? `Confirmer la réservation de ${confirmModal.booking?.client_name || "ce client"} sur ${confirmModal.booking?.fields?.name || "ce terrain"} ?`
            : `Êtes-vous sûr de vouloir annuler cette réservation ? Cette action est enregistrée dans les logs admin.`
        }
        confirmLabel={confirmModal.action === "validate" ? "Valider" : "Annuler la réservation"}
        variant={confirmModal.action === "cancel" ? "danger" : "primary"}
        loading={actionLoading}
        onConfirm={handleConfirmAction}
        onCancel={closeConfirm}
      />
    </div>
  );
}
