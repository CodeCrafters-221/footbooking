import { useState, useEffect } from "react";
import { Filter, Search, Calendar, Clock, MapPin, User } from "lucide-react";
import { getAdminBookings } from "../../../services/adminService";
import { toast } from "react-toastify";

export default function AdminBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState("all");
  const limit = 10;

  const fetchBookings = async () => {
    setLoading(true);
    try {
      const { data, count } = await getAdminBookings(page, limit, filter);
      setBookings(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      toast.error("Erreur lors du chargement des réservations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBookings();
  }, [page, filter]);

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Réservations Globales</h1>
          <p className="text-[#cbad90] mt-1">Toutes les réservations de la plateforme. Total: {totalCount}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#2c241b] p-4 rounded-2xl border border-[#493622]">
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-5 h-5 text-[#cbad90]" />
          <select 
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setPage(1); }}
            className="bg-[#231a10] border border-[#493622] rounded-xl text-white text-sm py-2.5 px-4 focus:outline-none focus:border-primary cursor-pointer w-full md:w-auto"
          >
            <option value="all">Tous les statuts</option>
            <option value="Confirmé">Confirmées</option>
            <option value="En attente de paiement">En attente</option>
            <option value="Annulé">Annulées</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#2c241b] border border-[#493622] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#231a10]/50 border-b border-[#493622] text-[#cbad90] text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">Date & Heure</th>
                <th className="p-4 font-medium">Terrain</th>
                <th className="p-4 font-medium">Client</th>
                <th className="p-4 font-medium">Prix</th>
                <th className="p-4 font-medium text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#493622]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-4"><div className="h-6 w-32 bg-[#493622] rounded"></div></td>
                    <td className="p-4"><div className="h-6 w-24 bg-[#493622] rounded"></div></td>
                    <td className="p-4"><div className="h-6 w-32 bg-[#493622] rounded"></div></td>
                    <td className="p-4"><div className="h-6 w-16 bg-[#493622] rounded"></div></td>
                    <td className="p-4"><div className="h-6 w-20 bg-[#493622] rounded-full ml-auto"></div></td>
                  </tr>
                ))
              ) : bookings.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-[#cbad90]">
                    Aucune réservation trouvée.
                  </td>
                </tr>
              ) : (
                bookings.map((b) => (
                  <tr key={b.id} className="hover:bg-[#493622]/30 transition-colors group">
                    <td className="p-4">
                      <p className="text-white font-bold text-sm flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-primary" />
                        {new Date(b.date).toLocaleDateString('fr-FR')}
                      </p>
                      <p className="text-[#cbad90] text-xs flex items-center gap-2 mt-1">
                        <Clock className="w-4 h-4" />
                        {b.start_time} - {b.end_time}
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
                    <td className="p-4 text-right">
                      <span className={`inline-flex px-2.5 py-1 rounded-md text-xs font-bold border ${
                        b.status === 'Confirmé' || b.status === 'Payé' ? 'bg-green-500/10 text-green-400 border-green-500/20' :
                        b.status === 'Annulé' ? 'bg-red-500/10 text-red-400 border-red-500/20' :
                        'bg-orange-500/10 text-orange-400 border-orange-500/20'
                      }`}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-4 border-t border-[#493622] flex items-center justify-between">
            <span className="text-sm text-[#cbad90]">
              Page {page} sur {totalPages}
            </span>
            <div className="flex gap-2">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-3 py-1.5 bg-[#493622] text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-[#5d452b] transition-colors"
              >
                Précédent
              </button>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-3 py-1.5 bg-[#493622] text-white rounded-lg text-sm font-medium disabled:opacity-50 hover:bg-[#5d452b] transition-colors"
              >
                Suivant
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
