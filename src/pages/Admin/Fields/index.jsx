import { useState, useEffect } from "react";
import { Plus, Search, Filter, MoreVertical, Edit2, Trash2, Eye, MapPin } from "lucide-react";
import { getAdminFields, toggleFieldStatus, softDeleteField } from "../../../services/adminService";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import AddVitrineModal from "./AddVitrineModal";

export default function AdminFields() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [filter, setFilter] = useState("all"); // 'all', 'admin', 'owner'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const limit = 10;

  const fetchFields = async () => {
    setLoading(true);
    try {
      const { data, count } = await getAdminFields(page, limit, filter);
      setFields(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      console.error("Erreur complète :", err);
      toast.error("Erreur lors du chargement des terrains : " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, [page, filter]);

  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = await toggleFieldStatus(id, currentStatus);
      setFields(fields.map(f => f.id === id ? { ...f, status: newStatus } : f));
      toast.success("Statut mis à jour");
    } catch (err) {
      toast.error("Erreur lors du changement de statut");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Voulez-vous vraiment suspendre (soft delete) ce terrain ?")) {
      try {
        await softDeleteField(id);
        setFields(fields.filter(f => f.id !== id));
        toast.success("Terrain supprimé");
        setTotalCount(prev => prev - 1);
      } catch (err) {
        toast.error("Erreur lors de la suppression");
      }
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Gestion des Terrains</h1>
          <p className="text-[#cbad90] mt-1">Gérez les terrains partenaires et vitrines. Total: {totalCount}</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-background-dark font-semibold px-4 py-2 rounded-xl transition-colors shadow-lg shadow-primary/20"
        >
          <Plus className="w-5 h-5" />
          Ajouter terrain vitrine
        </button>
      </div>

      <AddVitrineModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)} 
        onFieldAdded={fetchFields} 
      />

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#2c241b] p-4 rounded-2xl border border-[#493622]">
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#cbad90]" />
          <input
            type="text"
            placeholder="Rechercher un terrain..."
            className="w-full pl-10 pr-4 py-2.5 bg-[#231a10] border border-[#493622] rounded-xl text-white text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto">
          <Filter className="w-5 h-5 text-[#cbad90]" />
          <select 
            value={filter}
            onChange={(e) => { setFilter(e.target.value); setPage(1); }}
            className="bg-[#231a10] border border-[#493622] rounded-xl text-white text-sm py-2.5 px-4 focus:outline-none focus:border-primary cursor-pointer w-full md:w-auto"
          >
            <option value="all">Tous les terrains</option>
            <option value="owner">Partenaires (Owner)</option>
            <option value="admin">Vitrines (Admin)</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#2c241b] border border-[#493622] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-[#231a10]/50 border-b border-[#493622] text-[#cbad90] text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">Terrain</th>
                <th className="p-4 font-medium">Source</th>
                <th className="p-4 font-medium">Prix</th>
                <th className="p-4 font-medium">Statut</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#493622]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-4"><div className="h-10 w-48 bg-[#493622] rounded-lg"></div></td>
                    <td className="p-4"><div className="h-6 w-20 bg-[#493622] rounded-full"></div></td>
                    <td className="p-4"><div className="h-6 w-16 bg-[#493622] rounded"></div></td>
                    <td className="p-4"><div className="h-6 w-20 bg-[#493622] rounded-full"></div></td>
                    <td className="p-4"><div className="h-8 w-8 bg-[#493622] rounded-lg ml-auto"></div></td>
                  </tr>
                ))
              ) : fields.length === 0 ? (
                <tr>
                  <td colSpan="5" className="p-8 text-center text-[#cbad90]">
                    Aucun terrain trouvé.
                  </td>
                </tr>
              ) : (
                fields.map((field) => (
                  <tr key={field.id} className="hover:bg-[#493622]/30 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-12 h-12 rounded-lg bg-[#493622] bg-cover bg-center border border-[#493622] flex-shrink-0"
                          style={{ backgroundImage: `url(${field.field_images?.[0]?.url_image || '/placeholder.jpg'})` }}
                        />
                        <div>
                          <p className="text-white font-bold text-sm">{field.name}</p>
                          <p className="text-[#cbad90] text-xs flex items-center gap-1 mt-0.5">
                            <MapPin className="w-3 h-3" />
                            {field.adress?.substring(0, 25)}{field.adress?.length > 25 ? '...' : ''}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      {field.field_source === 'admin' ? (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20">
                          Vitrine
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">
                          Partenaire
                        </span>
                      )}
                    </td>
                    <td className="p-4">
                      <span className="text-white font-medium text-sm">
                        {field.field_source === 'admin' ? '-' : `${field.price_per_hour || field.price || 0} CFA`}
                      </span>
                    </td>
                    <td className="p-4">
                      <button 
                        onClick={() => handleToggleStatus(field.id, field.status)}
                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold uppercase tracking-wider transition-colors ${
                          field.status === 'active' 
                            ? 'bg-green-500/20 text-green-500 hover:bg-green-500/30' 
                            : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'
                        }`}
                      >
                        {field.status === 'active' ? 'Actif' : 'Inactif'}
                      </button>
                    </td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Link 
                          to={`/terrain-details/${field.id}`}
                          className="p-2 text-[#cbad90] hover:text-white bg-[#493622]/50 hover:bg-[#493622] rounded-lg transition-colors"
                          title="Voir"
                        >
                          <Eye className="w-4 h-4" />
                        </Link>
                        <button 
                          className="p-2 text-[#cbad90] hover:text-primary bg-[#493622]/50 hover:bg-primary/10 rounded-lg transition-colors"
                          title="Modifier"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => handleDelete(field.id)}
                          className="p-2 text-[#cbad90] hover:text-red-500 bg-[#493622]/50 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Supprimer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
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
