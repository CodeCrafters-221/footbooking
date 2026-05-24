import { useState, useEffect, useMemo } from "react";
import { 
  Plus, Search, Filter, Edit2, Trash2, Eye, MapPin, 
  Activity, Clock, Coins, Users, CheckCircle, Calendar, 
  ArrowUpDown, Phone, MessageCircle, X, Info, Trophy, Layout, ShieldAlert
} from "lucide-react";
import { getAdminFieldsFull, toggleFieldStatus, softDeleteField } from "../../../services/adminService";
import { toast } from "react-toastify";
import AddVitrineModal from "./AddVitrineModal";
import EditFieldModal from "./EditFieldModal";

export default function AdminFields() {
  const [fields, setFields] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Contrôles de filtrage, recherche, tri
  const [searchTerm, setSearchTerm] = useState("");
  const [filterSource, setFilterSource] = useState("all"); 
  const [filterStatus, setFilterStatus] = useState("all"); 
  const [filterPelouse, setFilterPelouse] = useState("all"); 
  const [filterCity, setFilterCity] = useState("all");
  const [sortOption, setSortOption] = useState("date-desc"); 
  
  // Pagination
  const [page, setPage] = useState(1);
  const itemsPerPage = 8;

  // Tiroir de détails (Slide-over)
  const [selectedField, setSelectedField] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [detailTab, setDetailTab] = useState("info"); 

  // Modales d'ajout & édition
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingField, setEditingField] = useState(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const fetchFields = async () => {
    setLoading(true);
    try {
      const data = await getAdminFieldsFull();
      setFields(data || []);
    } catch (err) {
      console.error("Erreur de récupération :", err);
      toast.error("Erreur lors du chargement des terrains : " + (err.message || ""));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFields();
  }, []);

  // Détecter toutes les villes uniques disponibles pour remplir le filtre
  const citiesList = useMemo(() => {
    const cities = new Set();
    fields.forEach(f => {
      const city = f.profiles?.ville || f.adress?.split(",")?.pop()?.trim();
      if (city && city.length > 2) {
        cities.add(city.charAt(0).toUpperCase() + city.slice(1).toLowerCase());
      }
    });
    return Array.from(cities);
  }, [fields]);

  // Basculer l'état Actif/Inactif
  const handleToggleStatus = async (id, currentStatus) => {
    try {
      const newStatus = await toggleFieldStatus(id, currentStatus);
      setFields(fields.map(f => f.id === id ? { ...f, status: newStatus } : f));
      if (selectedField && selectedField.id === id) {
        setSelectedField({ ...selectedField, status: newStatus });
      }
      toast.success(`Le terrain est désormais ${newStatus === 'active' ? 'Actif' : 'Inactif'}`);
    } catch (err) {
      toast.error("Erreur lors de la mise à jour du statut");
    }
  };

  // Supprimer un terrain (soft delete)
  const handleDelete = async (id) => {
    if (window.confirm("Voulez-vous vraiment suspendre (soft delete) ce terrain ?")) {
      try {
        await softDeleteField(id);
        setFields(fields.filter(f => f.id !== id));
        if (selectedField && selectedField.id === id) {
          setIsDetailOpen(false);
        }
        toast.success("Le terrain a été archivé avec succès.");
      } catch (err) {
        toast.error("Erreur lors de la suppression");
      }
    }
  };

  // Traiter le filtrage, la recherche et le tri en local
  const filteredFields = useMemo(() => {
    let result = [...fields];

    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(f => 
        f.name?.toLowerCase().includes(term) ||
        f.adress?.toLowerCase().includes(term) ||
        f.profiles?.name?.toLowerCase().includes(term) ||
        f.profiles?.ville?.toLowerCase().includes(term)
      );
    }

    if (filterSource !== "all") {
      result = result.filter(f => f.field_source === filterSource);
    }

    if (filterStatus !== "all") {
      result = result.filter(f => f.status === filterStatus);
    }

    if (filterPelouse !== "all") {
      result = result.filter(f => f.pelouse?.toLowerCase().includes(filterPelouse.toLowerCase()));
    }

    if (filterCity !== "all") {
      result = result.filter(f => {
        const city = f.profiles?.ville || f.adress?.split(",")?.pop()?.trim();
        return city?.toLowerCase() === filterCity.toLowerCase();
      });
    }

    // Tris
    result.sort((a, b) => {
      if (sortOption === "name-asc") return a.name.localeCompare(b.name);
      if (sortOption === "name-desc") return b.name.localeCompare(a.name);
      
      const priceA = a.price_per_hour || a.price || 0;
      const priceB = b.price_per_hour || b.price || 0;
      if (sortOption === "price-asc") return priceA - priceB;
      if (sortOption === "price-desc") return priceB - priceA;

      const dateA = new Date(a.created_at).getTime();
      const dateB = new Date(b.created_at).getTime();
      if (sortOption === "date-asc") return dateA - dateB;
      return dateB - dateA; 
    });

    return result;
  }, [fields, searchTerm, filterSource, filterStatus, filterPelouse, filterCity, sortOption]);

  useEffect(() => {
    setPage(1);
  }, [searchTerm, filterSource, filterStatus, filterPelouse, filterCity, sortOption]);

  // Pagination
  const paginatedFields = useMemo(() => {
    const start = (page - 1) * itemsPerPage;
    return filteredFields.slice(start, start + itemsPerPage);
  }, [filteredFields, page]);

  const totalPages = Math.ceil(filteredFields.length / itemsPerPage);

  const handleOpenDetails = (field) => {
    setSelectedField(field);
    setDetailTab("info");
    setIsDetailOpen(true);
  };

  const fieldStats = useMemo(() => {
    if (!selectedField) return { revenue: 0, count: 0, avg: 0 };
    
    const validReservations = (selectedField.reservations || []).filter(
      r => r.status === "Confirmé" || r.status === "Payé" || r.status === "completed"
    );

    const revenue = validReservations.reduce((sum, r) => sum + (r.total_price || 0), 0);
    const count = validReservations.length;
    const avg = count > 0 ? Math.round(revenue / count) : 0;

    return { revenue, count, avg };
  }, [selectedField]);

  const getDayNameFr = (dayNum) => {
    const days = ["Dimanche", "Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi"];
    return days[dayNum] || "Inconnu";
  };

  return (
    <div className="space-y-6 min-h-screen pb-12 px-2 sm:px-4 lg:px-6">
      
      {/* ── EN-TÊTE DE LA PAGE (Responsive Flexbox) ── */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-[#493622]/40 pb-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-3">
            <div className="p-2.5 bg-primary/10 border border-primary/20 rounded-xl">
              <Layout className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
            </div>
            GESTION DES TERRAINS
          </h1>
          <p className="text-[#cbad90] mt-1.5 text-xs sm:text-sm font-medium">
            Supervisez, modifiez et analysez les terrains vitrines et partenaires. Total : <span className="text-white font-black">{filteredFields.length}</span>
          </p>
        </div>
        <button 
          onClick={() => setIsAddOpen(true)}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-background-dark font-black px-6 py-3.5 rounded-xl transition-all shadow-lg shadow-orange-500/10 hover:shadow-orange-500/20 hover:scale-[1.02] active:scale-[0.98] text-sm"
        >
          <Plus className="w-5 h-5 stroke-[3px]" />
          Ajouter terrain vitrine
        </button>
      </div>

      {/* ── BARRE DE CONTROLE ULTRA-RESPONSIVE (Recherche & Filtres) ── */}
      <div className="bg-[#2c241b]/90 backdrop-blur-md p-4 sm:p-5 rounded-2xl border border-[#493622] space-y-4 shadow-xl">
        <div className="flex flex-col lg:flex-row gap-4">
          
          {/* Bloc de recherche */}
          <div className="relative flex-1">
            <Search className="w-5 h-5 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#cbad90]" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Rechercher par nom, ville, propriétaire..."
              className="w-full pl-11 pr-4 py-3 bg-[#1c1610] border border-[#493622] rounded-xl text-white text-sm focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/20 transition-all placeholder:text-gray-600"
            />
          </div>

          {/* Bloc de filtres en grille flexible */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-5 gap-3 w-full lg:w-auto">
            {/* Filtre Source */}
            <div className="flex flex-col justify-center">
              <select
                value={filterSource}
                onChange={(e) => setFilterSource(e.target.value)}
                className="w-full bg-[#1c1610] border border-[#493622] rounded-xl text-white text-xs py-3 px-3.5 focus:outline-none focus:border-primary/80 cursor-pointer transition-colors"
              >
                <option value="all">Toutes sources</option>
                <option value="admin">Vitrines (Admin)</option>
                <option value="owner">Partenaires (Owner)</option>
              </select>
            </div>

            {/* Filtre Statut */}
            <div className="flex flex-col justify-center">
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                className="w-full bg-[#1c1610] border border-[#493622] rounded-xl text-white text-xs py-3 px-3.5 focus:outline-none focus:border-primary/80 cursor-pointer transition-colors"
              >
                <option value="all">Tous statuts</option>
                <option value="active">Actifs</option>
                <option value="inactive">Inactifs</option>
              </select>
            </div>

            {/* Filtre Pelouse */}
            <div className="flex flex-col justify-center">
              <select
                value={filterPelouse}
                onChange={(e) => setFilterPelouse(e.target.value)}
                className="w-full bg-[#1c1610] border border-[#493622] rounded-xl text-white text-xs py-3 px-3.5 focus:outline-none focus:border-primary/80 cursor-pointer transition-colors"
              >
                <option value="all">Toutes pelouses</option>
                <option value="Synthétique">Synthétique</option>
                <option value="Naturel">Naturel</option>
                <option value="Indoor">Indoor (Futsal)</option>
              </select>
            </div>

            {/* Filtre Ville */}
            <div className="flex flex-col justify-center">
              <select
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                className="w-full bg-[#1c1610] border border-[#493622] rounded-xl text-white text-xs py-3 px-3.5 focus:outline-none focus:border-primary/80 cursor-pointer transition-colors"
              >
                <option value="all">Toutes villes</option>
                {citiesList.map(city => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </div>

            {/* Tri (Col-span sur mobile) */}
            <div className="flex flex-col justify-center sm:col-span-2 md:col-span-1">
              <select
                value={sortOption}
                onChange={(e) => setSortOption(e.target.value)}
                className="w-full bg-[#1c1610] border border-[#493622] rounded-xl text-primary font-black text-xs py-3 px-3.5 focus:outline-none focus:border-primary cursor-pointer transition-colors"
              >
                <option value="date-desc">🕒 Récent ➔ Ancien</option>
                <option value="date-asc">🕒 Ancien ➔ Récent</option>
                <option value="price-desc">💰 Prix décroissant</option>
                <option value="price-asc">💰 Prix croissant</option>
                <option value="name-asc">🔤 Nom A ➔ Z</option>
                <option value="name-desc">🔤 Nom Z ➔ A</option>
              </select>
            </div>

          </div>
        </div>
      </div>

      {/* ── CONTENEUR DE TABLE RESPONSIVE AVEC DEFILEMENT DE SECURITE ── */}
      <div className="bg-[#2c241b] border border-[#493622] rounded-2xl overflow-hidden shadow-2xl transition-all duration-300">
        <div className="overflow-x-auto scrollbar-thin scrollbar-thumb-[#493622] scrollbar-track-transparent">
          
          {/* min-w-table garantit qu'il n'y a pas d'écrasement des colonnes et que l'alignement reste somptueux */}
          <table className="w-full min-w-[820px] text-left border-collapse table-fixed">
            <thead>
              <tr className="bg-[#1c1610] border-b border-[#493622] text-[#cbad90] text-xs uppercase tracking-wider">
                <th className="p-4 font-black text-center w-[8%]">Photo</th>
                <th className="p-4 font-black w-[30%]">Terrain</th>
                <th className="p-4 font-black w-[10%]">Propriétaire</th>
                <th className="p-4 font-black w-[10%]">Ville</th>
                <th className="p-4 font-black text-center w-[14%]">Statut</th>
                <th className="p-4 font-black text-right pr-6 w-[14%]">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#493622]/30">
              {loading ? (
                Array.from({ length: itemsPerPage }).map((_, i) => (
                  <tr key={i} className="animate-pulse bg-[#231a10]/10">
                    <td className="p-4"><div className="h-12 w-12 bg-[#493622]/40 rounded-xl mx-auto"></div></td>
                    <td className="p-4"><div className="h-5 w-40 bg-[#493622]/40 rounded mb-2"></div><div className="h-3 w-20 bg-[#493622]/20 rounded"></div></td>
                    <td className="p-4"><div className="h-5 w-32 bg-[#493622]/40 rounded"></div></td>
                    <td className="p-4"><div className="h-5 w-20 bg-[#493622]/40 rounded"></div></td>
                    <td className="p-4"><div className="h-6 w-14 bg-[#493622]/40 rounded-full mx-auto"></div></td>
                    <td className="p-4 text-right"><div className="h-8 w-20 bg-[#493622]/40 rounded-lg ml-auto"></div></td>
                  </tr>
                ))
              ) : paginatedFields.length === 0 ? (
                <tr>
                  <td colSpan="7" className="p-16 text-center text-[#cbad90] font-medium bg-[#1c1610]/5">
                    <div className="w-16 h-16 rounded-full bg-[#493622]/20 flex items-center justify-center mx-auto mb-4 border border-[#493622]/30">
                      <ShieldAlert className="w-8 h-8 text-[#cbad90] opacity-60" />
                    </div>
                    <p className="text-sm font-bold text-white mb-1">Aucun terrain disponible</p>
                    <p className="text-xs text-gray-500">Essayez d'ajuster vos critères ou réinitialisez vos filtres.</p>
                  </td>
                </tr>
              ) : (
                paginatedFields.map((field) => {
                  const firstImage = field.field_images?.[0]?.url_image || "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80";
                  const cityName = field.profiles?.ville || field.adress?.split(",")?.pop()?.trim() || "Dakar";
                  const isVitrine = field.field_source === 'admin';
                  const activeSlotsCount = field.disponibilite?.length || 0;

                  return (
                    <tr key={field.id} className="hover:bg-[#493622]/15 border-l-4 border-l-transparent hover:border-l-primary transition-all duration-200 group">
                      
                      {/* Photo miniature */}
                      <td className="p-4 text-center">
                        <div 
                          className="w-12 h-12 rounded-xl bg-[#1c1610] bg-cover bg-center border border-[#493622]/70 flex-shrink-0 mx-auto shadow-md overflow-hidden transform group-hover:scale-[1.04] group-hover:border-primary/50 transition-all duration-300 cursor-pointer"
                          style={{ backgroundImage: `url(${firstImage})` }}
                          onClick={() => handleOpenDetails(field)}
                        />
                      </td>

                      {/* Terrain Infos */}
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span 
                            className="text-white font-bold text-sm tracking-tight hover:text-primary transition-colors cursor-pointer truncate max-w-[240px]"
                            onClick={() => handleOpenDetails(field)}
                            title={field.name}
                          >
                            {field.name}
                          </span>
                          <div className="flex flex-wrap gap-1.5 mt-1.5 items-center">
                            {isVitrine ? (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase bg-blue-500/10 text-blue-400 border border-blue-500/20 shadow-sm">
                                Vitrine
                              </span>
                            ) : (
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-black uppercase bg-green-500/10 text-green-400 border border-green-500/20 shadow-sm">
                                Partenaire
                              </span>
                            )}
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-400 font-bold bg-[#1c1610] px-2 py-0.5 rounded border border-[#493622]/50">
                              🌱 {field.pelouse || "Synthétique"}
                            </span>
                            <span className="inline-flex items-center gap-0.5 text-[10px] text-gray-400 font-bold bg-[#1c1610] px-2 py-0.5 rounded border border-[#493622]/50">
                              👥 5x5
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Propriétaire */}
                      <td className="p-4">
                        {isVitrine ? (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-amber-500/15 to-orange-500/15 border border-amber-500/30 text-amber-400 flex items-center justify-center text-xs font-black">
                              A
                            </div>
                            <span className="text-[#cbad90] font-bold text-xs uppercase tracking-wider">Admin</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-full bg-gradient-to-br from-purple-500/20 to-indigo-500/20 text-purple-400 flex items-center justify-center border border-purple-500/30 text-xs font-black uppercase shadow-inner">
                              {(field.profiles?.name || "P").charAt(0)}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="text-white text-xs font-bold truncate max-w-[130px]" title={field.profiles?.name}>{field.profiles?.name || "Propriétaire"}</span>
                              <span className="text-[10px] text-gray-500 font-medium">{field.profiles?.phone || "Pas de tél"}</span>
                            </div>
                          </div>
                        )}
                      </td>

                      {/* Ville */}
                      <td className="p-4">
                        <span className="text-[#cbad90] text-xs font-bold inline-flex items-center gap-1.5 bg-[#1c1610]/40 px-2.5 py-1 rounded-lg border border-[#493622]/40">
                          <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                          <span className="truncate max-w-[90px]" title={cityName}>{cityName}</span>
                        </span>
                      </td>

                      {/* Statut Toggle interactive */}
                      <td className="p-4 text-center">
                        <button 
                          onClick={() => handleToggleStatus(field.id, field.status)}
                          className={`inline-flex items-center justify-center px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider transition-all duration-300 border ${
                            field.status === 'active' 
                              ? 'bg-green-500/10 text-green-400 border-green-500/20 shadow-[0_0_12px_rgba(34,197,94,0.08)] hover:bg-green-500/20' 
                              : 'bg-red-500/10 text-red-400 border-red-500/20 hover:bg-red-500/20'
                          }`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full mr-1.5 ${field.status === 'active' ? 'bg-green-400 animate-pulse' : 'bg-red-400'}`} />
                          {field.status === 'active' ? 'Actif' : 'Inactif'}
                        </button>
                      </td>

                      {/* Date de création
                      <td className="p-4">
                        <span className="text-gray-500 text-xs font-bold block">
                          {new Date(field.created_at).toLocaleDateString('fr-FR', { 
                            day: '2-digit', month: 'short' 
                          })}
                        </span>
                        <span className="text-gray-600 text-[10px] font-semibold -mt-0.5 block">
                          {new Date(field.created_at).getFullYear()}
                        </span>
                      </td> */}

                      {/* Actions */}
                      <td className="p-4 text-right pr-6">
                        <div className="flex items-center justify-end gap-1.5">
                          <button 
                            onClick={() => handleOpenDetails(field)}
                            className="p-2 text-[#cbad90] hover:text-white bg-[#493622]/30 hover:bg-[#493622] rounded-xl transition-all duration-200 border border-[#493622]/20 hover:border-primary/20"
                            title="Détails"
                          >
                            <Eye className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => { setEditingField(field); setIsEditOpen(true); }}
                            className="p-2 text-[#cbad90] hover:text-primary bg-[#493622]/30 hover:bg-[#493622] rounded-xl transition-all duration-200 border border-[#493622]/20 hover:border-primary/20"
                            title="Modifier"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button 
                            onClick={() => handleDelete(field.id)}
                            className="p-2 text-[#cbad90] hover:text-red-500 bg-[#493622]/30 hover:bg-red-500/10 rounded-xl transition-all duration-200 border border-[#493622]/20 hover:border-red-500/20"
                            title="Supprimer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* ── PAGINATION ÉLÉGANTE ET RESPONSIVE ── */}
        {totalPages > 1 && (
          <div className="p-5 border-t border-[#493622] flex flex-col sm:flex-row gap-4 items-center justify-between bg-[#1c1610]/40">
            <span className="text-xs text-[#cbad90] font-medium text-center sm:text-left">
              Affichage de <span className="text-white font-black">{(page - 1) * itemsPerPage + 1}</span> à <span className="text-white font-black">{Math.min(page * itemsPerPage, filteredFields.length)}</span> sur <span className="text-white font-black">{filteredFields.length}</span> terrains
            </span>
            <div className="flex items-center gap-2.5">
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 bg-[#493622] hover:bg-[#5d452b] text-white rounded-xl text-xs font-black disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1 shadow-sm border border-[#493622]/55"
              >
                <ChevronLeft className="w-4 h-4 stroke-[3px]" />
                Précédent
              </button>
              <div className="hidden md:flex gap-1">
                {Array.from({ length: totalPages }).map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => setPage(idx + 1)}
                    className={`w-8 h-8 rounded-lg text-xs font-bold transition-all border ${
                      page === idx + 1 
                        ? 'bg-primary text-background-dark border-primary scale-105 shadow-md shadow-primary/10 font-black' 
                        : 'bg-[#493622]/20 hover:bg-[#493622] text-[#cbad90] hover:text-white border-[#493622]/40'
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 bg-[#493622] hover:bg-[#5d452b] text-white rounded-xl text-xs font-black disabled:opacity-30 disabled:cursor-not-allowed transition-all flex items-center gap-1 shadow-sm border border-[#493622]/55"
              >
                Suivant
                <ChevronRight className="w-4 h-4 stroke-[3px]" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── TIROIR LATÉRAL DE DÉTAILS COULISSANT (Drawer Slide-over) ── */}
      {isDetailOpen && selectedField && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/80 backdrop-blur-sm transition-opacity duration-300">
          {/* Clic d'arrière-plan pour fermer */}
          <div className="absolute inset-0 cursor-default" onClick={() => setIsDetailOpen(false)} />
          
          {/* Corps du tiroir (Responsive Width) */}
          <div className="relative w-full max-w-full md:max-w-xl h-full bg-[#1e1710] border-l border-[#493622] shadow-[0_0_60px_rgba(0,0,0,0.85)] z-10 flex flex-col overflow-hidden animate-slide-in">
            
            {/* Drawer Header */}
            <div className="p-5 sm:p-6 border-b border-[#493622] flex justify-between items-start bg-[#2c241b]">
              <div>
                <span className={`inline-flex px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider mb-2 border ${
                  selectedField.field_source === 'admin' 
                    ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' 
                    : 'bg-green-500/10 text-green-400 border-green-500/20'
                }`}>
                  {selectedField.field_source === 'admin' ? "Vitrine Administration" : "Terrain Partenaire"}
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-white italic tracking-tight uppercase leading-snug">{selectedField.name}</h2>
                <p className="text-xs text-[#cbad90] flex items-center gap-1 mt-1 font-bold">
                  <MapPin className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                  <span className="line-clamp-1">{selectedField.adress}</span>
                </p>
              </div>
              <button 
                onClick={() => setIsDetailOpen(false)}
                className="p-2 hover:bg-[#493622] text-[#cbad90] hover:text-white rounded-xl transition-all"
              >
                <X className="w-6 h-6" />
              </button>
            </div>

            {/* Scrollable Container */}
            <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 scrollbar-thin">
              
              {/* Galerie d'images */}
              <div className="space-y-2">
                <div 
                  className="w-full h-48 sm:h-60 rounded-2xl bg-[#1c1610] border border-[#493622] bg-cover bg-center shadow-lg transition-all duration-500"
                  style={{ backgroundImage: `url(${selectedField.field_images?.[0]?.url_image || "https://images.unsplash.com/photo-1574629810360-7efbbe195018?auto=format&fit=crop&q=80"})` }}
                />
                
                {selectedField.field_images && selectedField.field_images.length > 1 && (
                  <div className="grid grid-cols-5 gap-2">
                    {selectedField.field_images.map((img, index) => (
                      <a 
                        key={index} 
                        href={img.url_image} 
                        target="_blank" 
                        rel="noreferrer"
                        className="h-14 sm:h-16 rounded-lg border border-[#493622] bg-cover bg-center overflow-hidden hover:border-primary transition-all relative block"
                        style={{ backgroundImage: `url(${img.url_image})` }}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Statistiques financières */}
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <div className="bg-[#2c241b] border border-[#493622] p-3 sm:p-4 rounded-xl text-center shadow-md">
                  <Coins className="w-5 h-5 text-primary mx-auto mb-1.5" />
                  <p className="text-[9px] sm:text-[10px] text-[#cbad90] uppercase font-bold tracking-wider">Revenus</p>
                  <p className="text-xs sm:text-sm font-black text-white mt-1 truncate">{fieldStats.revenue.toLocaleString()} CFA</p>
                </div>
                <div className="bg-[#2c241b] border border-[#493622] p-3 sm:p-4 rounded-xl text-center shadow-md">
                  <CheckCircle className="w-5 h-5 text-green-400 mx-auto mb-1.5" />
                  <p className="text-[9px] sm:text-[10px] text-[#cbad90] uppercase font-bold tracking-wider">Réservations</p>
                  <p className="text-xs sm:text-sm font-black text-white mt-1">{fieldStats.count}</p>
                </div>
                <div className="bg-[#2c241b] border border-[#493622] p-3 sm:p-4 rounded-xl text-center shadow-md">
                  <Activity className="w-5 h-5 text-blue-400 mx-auto mb-1.5" />
                  <p className="text-[9px] sm:text-[10px] text-[#cbad90] uppercase font-bold tracking-wider">Panier Moyen</p>
                  <p className="text-xs sm:text-sm font-black text-white mt-1 truncate">{fieldStats.avg.toLocaleString()}</p>
                </div>
              </div>

              {/* Onglets interactifs */}
              <div className="flex border-b border-[#493622] bg-[#2c241b]/30 rounded-lg p-1">
                <button
                  onClick={() => setDetailTab("info")}
                  className={`flex-1 py-2 text-center text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-md transition-all ${
                    detailTab === 'info' 
                      ? 'bg-primary text-background-dark shadow-sm font-black' 
                      : 'text-[#cbad90] hover:text-white'
                  }`}
                >
                  Infos & Contact
                </button>
                <button
                  onClick={() => setDetailTab("availabilities")}
                  className={`flex-1 py-2 text-center text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-md transition-all ${
                    detailTab === 'availabilities' 
                      ? 'bg-primary text-background-dark shadow-sm font-black' 
                      : 'text-[#cbad90] hover:text-white'
                  }`}
                >
                  Plages ({selectedField.disponibilite?.length || 0})
                </button>
                <button
                  onClick={() => setDetailTab("bookings")}
                  className={`flex-1 py-2 text-center text-[10px] sm:text-xs font-black uppercase tracking-wider rounded-md transition-all ${
                    detailTab === 'bookings' 
                      ? 'bg-primary text-background-dark shadow-sm font-black' 
                      : 'text-[#cbad90] hover:text-white'
                  }`}
                >
                  Historique ({selectedField.reservations?.length || 0})
                </button>
              </div>

              {/* ONGLET 1 : INFO & PROPRIETAIRE */}
              {detailTab === 'info' && (
                <div className="space-y-5">
                  {/* Spécifications techniques */}
                  <div className="bg-[#2c241b] border border-[#493622] p-4 sm:p-5 rounded-xl space-y-4 shadow-sm">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest border-b border-[#493622] pb-2">Spécifications</h3>
                    <div className="grid grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-gray-500 block">Revêtement / Pelouse :</span>
                        <span className="font-bold text-white">{selectedField.pelouse || "Synthétique"}</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Format du terrain :</span>
                        <span className="font-bold text-white">5x5 (10 joueurs)</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Tarif horaire :</span>
                        <span className="font-black text-white">{(selectedField.price_per_hour || selectedField.price || 0).toLocaleString()} CFA / h</span>
                      </div>
                      <div>
                        <span className="text-gray-500 block">Identifiant unique :</span>
                        <span className="font-mono text-gray-500 truncate block select-all">{selectedField.id}</span>
                      </div>
                    </div>
                  </div>

                  {/* Description */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-black text-white uppercase tracking-widest">Description</h4>
                    <p className="text-xs text-[#cbad90] leading-relaxed bg-[#1c1610] border border-[#493622] p-4 rounded-xl italic">
                      {selectedField.description || "Aucune description fournie pour ce terrain."}
                    </p>
                  </div>

                  {/* Propriétaire lié */}
                  <div className="bg-[#2c241b] border border-[#493622] p-4 sm:p-5 rounded-xl space-y-4 shadow-sm">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest border-b border-[#493622] pb-2">Propriétaire Lié</h3>
                    {selectedField.field_source === 'admin' ? (
                      <div className="flex flex-col items-center py-2 space-y-2">
                        <div className="w-12 h-12 bg-primary/10 border border-primary/20 text-primary rounded-full flex items-center justify-center font-black text-xl">
                          A
                        </div>
                        <div className="text-center">
                          <p className="text-sm font-bold text-white">Administration Centrale</p>
                          <p className="text-xs text-gray-500 font-medium">Géré en interne par footbooking</p>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 bg-purple-500/10 border border-purple-500/20 text-purple-400 rounded-full flex items-center justify-center font-black text-lg uppercase shadow-inner">
                            {(selectedField.profiles?.name || "?").charAt(0)}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-white leading-tight">{selectedField.profiles?.name || "Propriétaire Inconnu"}</p>
                            <span className="text-[10px] font-bold text-purple-400 bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 rounded uppercase tracking-wider mt-1 inline-block">Rôle: {selectedField.profiles?.role || "owner"}</span>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3 text-xs border-t border-[#493622] pt-3">
                          <div>
                            <span className="text-gray-500 block">Téléphone :</span>
                            <a href={`tel:${selectedField.profiles?.phone}`} className="font-bold text-white hover:underline hover:text-primary transition-colors">{selectedField.profiles?.phone || "Non renseigné"}</a>
                          </div>
                          <div>
                            <span className="text-gray-500 block">Ville :</span>
                            <span className="font-bold text-white">{selectedField.profiles?.ville || "Non renseignée"}</span>
                          </div>
                        </div>

                        {selectedField.profiles?.phone && (
                          <a 
                            href={`https://wa.me/${selectedField.profiles.phone.replace(/[^0-9]/g, "")}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-4 w-full bg-[#25D366] hover:bg-[#20bd5a] text-white font-black py-3 rounded-xl active:scale-[0.98] transition-all flex items-center justify-center gap-2 text-xs shadow-md shadow-green-500/5 hover:shadow-green-500/15"
                          >
                            <MessageCircle className="w-4.5 h-4.5 fill-white" />
                            Contacter via WhatsApp
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* ONGLET 2 : DISPONIBILITÉS */}
              {detailTab === 'availabilities' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#493622] pb-3">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Grille Horaire</h3>
                    <span className="text-[10px] font-black text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">{selectedField.disponibilite?.length || 0} plages</span>
                  </div>

                  {(!selectedField.disponibilite || selectedField.disponibilite.length === 0) ? (
                    <div className="p-8 text-center text-xs text-[#cbad90] bg-[#2c241b] rounded-xl border border-dashed border-[#493622] italic">
                      Aucune plage horaire spécifique configurée. Le terrain utilise la configuration par défaut (08:00 - 00:00).
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {[1, 2, 3, 4, 5, 6, 0].map(dayOfWeekIndex => {
                        const slotsForDay = selectedField.disponibilite.filter(d => d.day_of_week === dayOfWeekIndex);
                        if (slotsForDay.length === 0) return null;

                        return (
                          <div key={dayOfWeekIndex} className="bg-[#2c241b] border border-[#493622] p-4 rounded-xl flex items-center justify-between shadow-sm">
                            <span className="text-xs font-black text-white uppercase tracking-widest">{getDayNameFr(dayOfWeekIndex)}</span>
                            <div className="flex flex-wrap gap-1.5 justify-end max-w-[70%]">
                              {slotsForDay.map(slot => (
                                <span key={slot.id} className="inline-flex items-center gap-1 px-2.5 py-1 rounded bg-[#1c1610] border border-[#493622] text-xs font-mono font-bold text-[#cbad90]">
                                  🕒 {slot.start_time?.substring(0, 5)} - {slot.end_time?.substring(0, 5)}
                                </span>
                              ))}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* ONGLET 3 : HISTORIQUE RESERVATIONS */}
              {detailTab === 'bookings' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b border-[#493622] pb-3">
                    <h3 className="text-xs font-black text-white uppercase tracking-widest">Historique de Réservations</h3>
                    <span className="text-[10px] font-black text-primary bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">{selectedField.reservations?.length || 0} réservations</span>
                  </div>

                  {(!selectedField.reservations || selectedField.reservations.length === 0) ? (
                    <div className="p-8 text-center text-xs text-[#cbad90] bg-[#2c241b] rounded-xl border border-dashed border-[#493622] italic">
                      Aucune réservation enregistrée pour le moment.
                    </div>
                  ) : (
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-1 scrollbar-thin">
                      {selectedField.reservations.map(res => {
                        const isSuccess = res.status === "Confirmé" || res.status === "Payé" || res.status === "completed";
                        
                        return (
                          <div key={res.id} className="bg-[#2c241b] border border-[#493622] p-4 rounded-xl flex items-center justify-between hover:border-primary/25 transition-colors shadow-sm">
                            <div className="flex flex-col space-y-1">
                              <p className="text-xs font-bold text-white leading-snug">{res.client_name || "Client footbooking"}</p>
                              <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold">
                                <span className="flex items-center gap-1"><Calendar className="w-3 h-3 text-primary" /> {new Date(res.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}</span>
                                <span>•</span>
                                <span className="flex items-center gap-1"><Clock className="w-3 h-3 text-primary" /> {res.start_time?.substring(0, 5)} - {res.end_time?.substring(0, 5)}</span>
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded border ${
                                isSuccess 
                                  ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                                  : res.status === 'Annulé' 
                                    ? 'bg-red-500/10 text-red-400 border-red-500/20' 
                                    : 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20'
                              }`}>
                                {res.status}
                              </span>
                              <span className="text-xs font-black text-white">{res.total_price?.toLocaleString()} CFA</span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* ── MODALE D'AJOUT DE TERRAIN VITRINE ── */}
      <AddVitrineModal 
        isOpen={isAddOpen} 
        onClose={() => setIsAddOpen(false)} 
        onFieldAdded={fetchFields} 
      />

      {/* ── MODALE D'ÉDITION DE TERRAIN ── */}
      <EditFieldModal
        isOpen={isEditOpen}
        onClose={() => { setIsEditOpen(false); setEditingField(null); }}
        field={editingField}
        onFieldUpdated={fetchFields}
      />
    </div>
  );
}
