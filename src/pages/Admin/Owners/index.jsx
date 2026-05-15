import { useState, useEffect } from "react";
import { Briefcase, Map, Phone, Search, UserX, UserCheck, MessageCircle } from "lucide-react";
import { getAdminOwners, suspendOwner, reactivateOwner } from "../../../services/adminService";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

export default function AdminOwners() {
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const limit = 10;

  const fetchOwners = async () => {
    setLoading(true);
    try {
      const { data, count } = await getAdminOwners(page, limit, search);
      setOwners(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du chargement des propriétaires");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const t = setTimeout(() => fetchOwners(), 300);
    return () => clearTimeout(t);
  }, [page, search]);

  const handleSuspend = async (owner) => {
    if (!window.confirm(`Voulez-vous vraiment suspendre ${owner.name} ? Son compte passera en "user".`)) return;
    try {
      await suspendOwner(owner.id);
      setOwners(owners.filter(o => o.id !== owner.id));
      setTotalCount(prev => prev - 1);
      toast.success(`${owner.name} a été suspendu.`);
    } catch {
      toast.error("Erreur lors de la suspension.");
    }
  };

  const whatsappLink = (phone) => {
    const cleaned = String(phone || "").replace(/[^0-9]/g, "");
    return `https://wa.me/${cleaned}`;
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Propriétaires (Partenaires)</h1>
          <p className="text-[#cbad90] mt-1">
            Gérez les partenaires de la plateforme. <span className="font-bold text-white">{totalCount}</span> partenaires au total.
          </p>
        </div>
      </div>

      {/* Search */}
      <div className="bg-[#2c241b] p-4 rounded-2xl border border-[#493622]">
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#cbad90]" />
          <input
            type="text"
            placeholder="Rechercher un propriétaire..."
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-[#231a10] border border-[#493622] rounded-xl text-white text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#2c241b] border border-[#493622] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#231a10]/50 border-b border-[#493622] text-[#cbad90] text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">Propriétaire</th>
                <th className="p-4 font-medium">Contact</th>
                <th className="p-4 font-medium">Terrains actifs</th>
                <th className="p-4 font-medium">Inscription</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#493622]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-4"><div className="h-10 w-48 bg-[#493622] rounded-lg"></div></td>
                    <td className="p-4"><div className="h-6 w-32 bg-[#493622] rounded"></div></td>
                    <td className="p-4"><div className="h-6 w-16 bg-[#493622] rounded-full"></div></td>
                    <td className="p-4"><div className="h-6 w-24 bg-[#493622] rounded"></div></td>
                    <td className="p-4"><div className="h-8 w-24 bg-[#493622] rounded-lg ml-auto"></div></td>
                  </tr>
                ))
              ) : owners.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-[#cbad90]">
                    Aucun propriétaire trouvé.
                  </td>
                </tr>
              ) : (
                owners.map((o) => (
                  <tr key={o.id} className="hover:bg-[#493622]/30 transition-colors group">
                    {/* Info */}
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-blue-500/20 border border-blue-500/50 flex items-center justify-center text-blue-400 font-bold text-sm">
                          {o.name?.charAt(0)?.toUpperCase() || "?"}
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm">{o.name || "Inconnu"}</p>
                          <p className="text-[#cbad90] text-xs mt-0.5">{o.ville || "Ville inconnue"}</p>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="p-4">
                      {o.phone ? (
                        <div className="flex items-center gap-3">
                          <a
                            href={whatsappLink(o.phone)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20 transition-colors"
                          >
                            <MessageCircle className="w-3.5 h-3.5" />
                            WhatsApp
                          </a>
                          <a
                            href={`tel:${o.phone}`}
                            className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20 hover:bg-blue-500/20 transition-colors"
                          >
                            <Phone className="w-3.5 h-3.5" />
                            {o.phone}
                          </a>
                        </div>
                      ) : (
                        <span className="text-gray-500 text-sm italic">Non renseigné</span>
                      )}
                    </td>

                    {/* Field count */}
                    <td className="p-4">
                      <Link
                        to={`/admin/terrains?owner=${o.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-primary/10 text-primary border border-primary/20 hover:bg-primary/20 transition-colors"
                      >
                        <Map className="w-3 h-3" />
                        {o.fieldCount} terrain{o.fieldCount > 1 ? "s" : ""}
                      </Link>
                    </td>

                    {/* Date */}
                    <td className="p-4">
                      <span className="text-[#cbad90] text-sm">
                        {new Date(o.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}
                      </span>
                    </td>

                    {/* Actions */}
                    <td className="p-4 text-right">
                      <button
                        onClick={() => handleSuspend(o)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors"
                      >
                        <UserX className="w-3.5 h-3.5" />
                        Suspendre
                      </button>
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
            <span className="text-sm text-[#cbad90]">Page {page} sur {totalPages}</span>
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
