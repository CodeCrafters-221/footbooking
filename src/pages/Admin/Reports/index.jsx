import { useState, useEffect, useMemo } from "react";
import {
  Search,
  Filter,
  Flag,
  Eye,
  X,
  MessageSquare,
} from "lucide-react";
import { toast } from "react-toastify";
import { getReports, saveReports } from "../../../utils/platformConfig";

const STATUS_OPTIONS = [
  { value: "all", label: "Tous les statuts" },
  { value: "nouveau", label: "Nouveau" },
  { value: "en_cours", label: "En cours" },
  { value: "resolu", label: "Résolu" },
  { value: "rejete", label: "Rejeté" },
];

const TYPE_OPTIONS = [
  { value: "all", label: "Tous les types" },
  { value: "comportement", label: "Comportement" },
  { value: "terrain", label: "Terrain" },
  { value: "paiement", label: "Paiement" },
  { value: "autre", label: "Autre" },
];

const statusBadge = {
  nouveau: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  en_cours: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  resolu: "bg-green-500/10 text-green-400 border-green-500/20",
  rejete: "bg-red-500/10 text-red-400 border-red-500/20",
};

export default function AdminReports() {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [selected, setSelected] = useState(null);
  const [adminComment, setAdminComment] = useState("");

  useEffect(() => {
    setLoading(true);
    setReports(getReports());
    setLoading(false);
  }, []);

  const filtered = useMemo(() => {
    let list = [...reports];
    if (statusFilter !== "all") {
      list = list.filter((r) => r.status === statusFilter);
    }
    if (typeFilter !== "all") {
      list = list.filter((r) => r.type === typeFilter);
    }
    if (search.trim()) {
      const term = search.toLowerCase();
      list = list.filter(
        (r) =>
          r.reporterName?.toLowerCase().includes(term) ||
          r.targetLabel?.toLowerCase().includes(term) ||
          r.description?.toLowerCase().includes(term),
      );
    }
    return list.sort(
      (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    );
  }, [reports, search, statusFilter, typeFilter]);

  const openDetail = (report) => {
    setSelected(report);
    setAdminComment(report.adminComment || "");
  };

  const persist = (updated) => {
    setReports(updated);
    saveReports(updated);
  };

  const handleStatusChange = (newStatus) => {
    if (!selected) return;
    const updated = reports.map((r) =>
      r.id === selected.id ? { ...r, status: newStatus, adminComment } : r,
    );
    persist(updated);
    setSelected({ ...selected, status: newStatus, adminComment });
    toast.success("Statut mis à jour");
  };

  const handleSaveComment = () => {
    if (!selected) return;
    const updated = reports.map((r) =>
      r.id === selected.id ? { ...r, adminComment } : r,
    );
    persist(updated);
    setSelected({ ...selected, adminComment });
    toast.success("Commentaire enregistré");
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Flag className="w-7 h-7 text-primary" />
            Signalements
          </h1>
          <p className="text-[#cbad90] mt-1 text-sm">
            Plaintes et requêtes — {filtered.length} élément(s)
          </p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-4 bg-[#2c241b] p-4 rounded-2xl border border-[#493622]">
        <div className="relative flex-1">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#cbad90]" />
          <input
            type="text"
            placeholder="Rechercher..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 bg-[#231a10] border border-[#493622] rounded-xl text-white text-sm focus:outline-none focus:border-primary"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex items-center gap-2">
            <Filter className="w-5 h-5 text-[#cbad90] shrink-0" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-[#231a10] border border-[#493622] rounded-xl text-white text-sm py-2.5 px-3 focus:outline-none focus:border-primary w-full sm:w-auto"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="bg-[#231a10] border border-[#493622] rounded-xl text-white text-sm py-2.5 px-3 focus:outline-none focus:border-primary w-full sm:w-auto"
          >
            {TYPE_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-[#2c241b] border border-[#493622] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left min-w-[640px]">
            <thead>
              <tr className="bg-[#231a10]/50 border-b border-[#493622] text-[#cbad90] text-xs uppercase">
                <th className="p-4 font-medium">Date</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Signaleur</th>
                <th className="p-4 font-medium">Cible</th>
                <th className="p-4 font-medium">Statut</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#493622]">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td colSpan={6} className="p-4">
                      <div className="h-10 bg-[#493622] rounded" />
                    </td>
                  </tr>
                ))
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-12 text-center text-[#cbad90]">
                    <Flag className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium text-white">Aucun signalement</p>
                    <p className="text-xs mt-1">Ajustez vos filtres ou revenez plus tard.</p>
                  </td>
                </tr>
              ) : (
                filtered.map((r) => (
                  <tr key={r.id} className="hover:bg-[#493622]/30 transition-colors">
                    <td className="p-4 text-sm text-[#cbad90]">
                      {new Date(r.createdAt).toLocaleDateString("fr-FR")}
                    </td>
                    <td className="p-4 text-sm text-white capitalize">{r.type}</td>
                    <td className="p-4 text-sm text-white">{r.reporterName}</td>
                    <td className="p-4 text-sm text-[#cbad90] max-w-[180px] truncate">
                      {r.targetLabel}
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex px-2 py-0.5 rounded text-xs font-bold border capitalize ${statusBadge[r.status] || statusBadge.nouveau}`}
                      >
                        {r.status.replace("_", " ")}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button
                        type="button"
                        onClick={() => openDetail(r)}
                        className="p-2 text-[#cbad90] hover:text-white bg-[#493622]/40 rounded-lg hover:bg-[#493622]"
                        title="Voir détails"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/70 backdrop-blur-sm">
          <div
            className="absolute inset-0"
            onClick={() => setSelected(null)}
            aria-hidden
          />
          <div className="relative w-full max-w-lg h-full bg-[#1e1710] border-l border-[#493622] flex flex-col shadow-2xl">
            <div className="p-5 border-b border-[#493622] flex justify-between items-start bg-[#2c241b]">
              <div>
                <span
                  className={`inline-flex px-2 py-0.5 rounded text-[10px] font-bold border capitalize mb-2 ${statusBadge[selected.status]}`}
                >
                  {selected.status.replace("_", " ")}
                </span>
                <h2 className="text-lg font-bold text-white capitalize">
                  Signalement — {selected.type}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelected(null)}
                className="p-2 text-[#cbad90] hover:text-white rounded-lg hover:bg-[#493622]"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <DetailRow label="Signaleur" value={selected.reporterName} />
              <DetailRow label="Cible" value={selected.targetLabel} />
              <DetailRow label="Type de cible" value={selected.targetType} />
              <div>
                <p className="text-xs text-gray-500 mb-1">Description</p>
                <p className="text-sm text-[#cbad90] bg-[#231a10] border border-[#493622] p-3 rounded-xl">
                  {selected.description}
                </p>
              </div>

              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wider mb-2">
                  Changer le statut
                </p>
                <div className="flex flex-wrap gap-2">
                  {["nouveau", "en_cours", "resolu", "rejete"].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => handleStatusChange(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold border capitalize transition-colors ${
                        selected.status === s
                          ? "bg-primary text-background-dark border-primary"
                          : "border-[#493622] text-[#cbad90] hover:border-primary/50"
                      }`}
                    >
                      {s.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-xs font-bold text-white uppercase tracking-wider mb-2 flex items-center gap-1">
                  <MessageSquare className="w-3.5 h-3.5" />
                  Commentaire administratif
                </p>
                <textarea
                  value={adminComment}
                  onChange={(e) => setAdminComment(e.target.value)}
                  rows={4}
                  placeholder="Notes internes..."
                  className="w-full px-3 py-2 bg-[#231a10] border border-[#493622] rounded-xl text-white text-sm focus:outline-none focus:border-primary resize-none"
                />
                <button
                  type="button"
                  onClick={handleSaveComment}
                  className="mt-2 px-4 py-2 bg-primary text-background-dark rounded-xl text-sm font-semibold hover:bg-primary-hover"
                >
                  Enregistrer le commentaire
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function DetailRow({ label, value }) {
  return (
    <div>
      <p className="text-xs text-gray-500">{label}</p>
      <p className="text-sm text-white font-medium">{value}</p>
    </div>
  );
}
