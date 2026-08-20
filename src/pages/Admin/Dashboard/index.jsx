import { useState, useEffect } from "react";
import {
  Users, Map, CalendarCheck, TrendingUp, Activity,
  RefreshCw, Clock, Building2, ArrowUpRight, Trophy
} from "lucide-react";
import { getAdminStats, getRecentAdminLogs } from "../../../services/adminService";
import { toast } from "react-toastify";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";

/* ─── Skeleton Atoms ─── */
const SkeletonBox = ({ w = "w-full", h = "h-4", className = "" }) => (
  <div className={`bg-[#493622]/60 animate-pulse rounded-lg ${w} ${h} ${className}`} />
);

/* ─── Stat Card ─── */
function StatCard({ title, value, icon: Icon, color, bg, loading, trend }) {
  return (
    <div className="bg-[#2c241b] p-6 rounded-2xl border border-[#493622] shadow-xl hover:-translate-y-1 transition-all duration-200 group">
      <div className="flex items-start justify-between">
        <div className={`p-3 rounded-xl ${bg} ${color}`}>
          <Icon className="w-6 h-6" />
        </div>
        {trend !== undefined && !loading && (
          <span className={`text-xs font-semibold flex items-center gap-0.5 px-2 py-1 rounded-full ${trend >= 0 ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'}`}>
            <ArrowUpRight className={`w-3 h-3 ${trend < 0 ? 'rotate-180' : ''}`} />
            {Math.abs(trend)}%
          </span>
        )}
      </div>
      <div className="mt-4">
        <p className="text-sm font-medium text-[#cbad90]">{title}</p>
        {loading ? (
          <SkeletonBox w="w-24" h="h-8" className="mt-2" />
        ) : (
          <p className="text-3xl font-bold text-white mt-1 tracking-tight">{value}</p>
        )}
      </div>
    </div>
  );
}

/* ─── Chart Card ─── */
function ChartCard({ title, children, loading, height = 240 }) {
  return (
    <div className="bg-[#2c241b] p-6 rounded-2xl border border-[#493622] shadow-xl">
      <h3 className="text-base font-bold text-white mb-5">{title}</h3>
      {loading ? (
        <div style={{ height }} className="flex flex-col justify-end gap-2 px-2">
          {[0.4, 0.7, 0.55, 0.85, 0.6, 0.9, 0.5, 0.75, 0.65, 0.8, 0.45, 0.95].map((h, i) => (
            <div key={i} className="bg-[#493622]/60 animate-pulse rounded-t-sm w-full" style={{ height: `${h * 60}%` }} />
          ))}
        </div>
      ) : children}
    </div>
  );
}

/* ─── Custom Tooltip ─── */
const CustomTooltip = ({ active, payload, label, prefix = "", suffix = "" }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-[#1f160e] border border-[#493622] rounded-xl px-4 py-3 shadow-xl">
      <p className="text-[#cbad90] text-xs mb-1">{label}</p>
      <p className="text-white font-bold text-sm">{prefix}{(payload[0].value || 0).toLocaleString('fr-FR')}{suffix}</p>
    </div>
  );
};

/* ─── Main Dashboard ─── */
export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalFields: 0, totalUsers: 0, totalBookings: 0,
    totalRevenue: 0, totalOwners: 0,
    bookingsByMonth: [], revenueByMonth: [],
    recentBookings: [], newUsers: [], topFields: []
  });

  const fetchAll = async () => {
    setLoading(true);
    setLogsLoading(true);
    try {
      const [statsData, logsData] = await Promise.all([
        getAdminStats(),
        getRecentAdminLogs(8)
      ]);
      setStats(statsData);
      setLogs(logsData);
    } catch {
      toast.error("Erreur lors du chargement des données.");
    } finally {
      setLoading(false);
      setLogsLoading(false);
    }
  };

  useEffect(() => { fetchAll(); }, []);

  const statCards = [
    { title: "Terrains actifs", value: stats.totalFields, icon: Map, color: "text-blue-400", bg: "bg-blue-500/10" },
    { title: "Réservations (12 mois)", value: stats.totalBookings.toLocaleString('fr-FR'), icon: CalendarCheck, color: "text-green-400", bg: "bg-green-500/10" },
    { title: "Revenus générés (FCFA)", value: stats.totalRevenue.toLocaleString('fr-FR'), icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
    { title: "Utilisateurs inscrits", value: stats.totalUsers.toLocaleString('fr-FR'), icon: Users, color: "text-purple-400", bg: "bg-purple-500/10" },
    { title: "Propriétaires actifs", value: stats.totalOwners, icon: Building2, color: "text-orange-400", bg: "bg-orange-500/10" },
  ];

  const formatAction = (action) => ({
    'activated_field': '✅ a activé un terrain',
    'deactivated_field': '⛔ a désactivé un terrain',
    'soft_deleted_field': '🗑️ a supprimé un terrain',
    'created_vitrine_field': '🏟️ a ajouté un terrain vitrine',
    'changed_role_to_owner': '⬆️ a promu en propriétaire',
    'changed_role_to_super_admin': '🛡️ a promu en admin',
    'changed_role_to_user': '⬇️ a rétrogradé en user',
    'suspended_owner': '🚫 a suspendu un propriétaire',
  }[action] || action);

  const getStatusBadge = (status) => {
    const map = {
      'Confirmé': 'bg-green-500/15 text-green-400 border-green-500/30',
      'Payé': 'bg-green-500/15 text-green-400 border-green-500/30',
      'Annulé': 'bg-red-500/15 text-red-400 border-red-500/30',
      'En attente': 'bg-orange-500/15 text-orange-400 border-orange-500/30',
    };
    return map[status] || 'bg-gray-500/15 text-gray-400 border-gray-500/30';
  };

  return (
    <div className="space-y-7 pb-8">

      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Super Admin</h1>
          <p className="text-[#cbad90] mt-0.5 text-sm">Vue d'ensemble de la plateforme Footbooking</p>
        </div>
        <button
          onClick={fetchAll}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#2c241b] border border-[#493622] rounded-xl text-white hover:bg-[#493622] transition-colors text-sm font-medium"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* ── Stat Cards (5) ── */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
        {statCards.map((s, i) => (
          <StatCard key={i} {...s} loading={loading} />
        ))}
      </div>

      {/* ── Charts Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Réservations par mois */}
        <ChartCard title="📅 Réservations par mois" loading={loading} height={240}>
          <ResponsiveContainer width="100%" height={240}>
            <BarChart data={stats.bookingsByMonth} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#3a2b1a" vertical={false} />
              <XAxis dataKey="name" stroke="#888" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <YAxis stroke="#888" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} allowDecimals={false} />
              <Tooltip content={<CustomTooltip suffix=" résa" />} cursor={{ fill: 'rgba(73,54,34,0.4)' }} />
              <Bar dataKey="value" fill="#f27f0d" radius={[6, 6, 0, 0]} maxBarSize={40} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Revenus par mois */}
        <ChartCard title="💰 Revenus par mois (FCFA)" loading={loading} height={240}>
          <ResponsiveContainer width="100%" height={240}>
            <AreaChart data={stats.revenueByMonth} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <defs>
                <linearGradient id="gradRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f27f0d" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f27f0d" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#3a2b1a" vertical={false} />
              <XAxis dataKey="name" stroke="#888" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} />
              <YAxis stroke="#888" tickLine={false} axisLine={false} tick={{ fontSize: 11 }} tickFormatter={v => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip content={<CustomTooltip suffix=" FCFA" />} />
              <Area type="monotone" dataKey="value" stroke="#f27f0d" strokeWidth={2.5} fillOpacity={1} fill="url(#gradRevenue)" dot={false} activeDot={{ r: 5, fill: '#f27f0d' }} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* ── Bottom Row ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

        {/* Dernières réservations */}
        <div className="lg:col-span-2 bg-[#2c241b] rounded-2xl border border-[#493622] shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-[#493622] flex items-center justify-between">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CalendarCheck className="w-4 h-4 text-primary" />
              Dernières réservations
            </h3>
          </div>
          <div className="divide-y divide-[#493622]/50">
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="px-6 py-4 flex items-center gap-4 animate-pulse">
                  <SkeletonBox w="w-10" h="h-10" className="rounded-full flex-shrink-0" />
                  <div className="flex-1 space-y-2">
                    <SkeletonBox w="w-40" h="h-3" />
                    <SkeletonBox w="w-24" h="h-3" />
                  </div>
                  <SkeletonBox w="w-20" h="h-6" className="rounded-full" />
                </div>
              ))
            ) : stats.recentBookings.length === 0 ? (
              <div className="px-6 py-10 text-center text-[#cbad90] text-sm">Aucune réservation récente.</div>
            ) : (
              stats.recentBookings.map((b) => (
                <div key={b.id} className="px-6 py-4 flex items-center gap-4 hover:bg-[#493622]/20 transition-colors">
                  <div className="w-10 h-10 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs flex-shrink-0">
                    {(b.client_name || "?").charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{b.client_name || (b.user_id ? "Client App" : "Anonyme")}</p>
                    <p className="text-xs text-[#cbad90] mt-0.5 flex items-center gap-1.5">
                      <Map className="w-3 h-3" />
                      {b.fields?.name || "Terrain inconnu"}
                      <span className="text-gray-600">•</span>
                      <Clock className="w-3 h-3" />
                      {b.date ? new Date(b.date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : "—"}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <span className={`text-xs font-bold px-2.5 py-0.5 rounded-full border ${getStatusBadge(b.status)}`}>{b.status}</span>
                    <span className="text-xs font-bold text-white">{(b.total_price || 0).toLocaleString('fr-FR')} <span className="text-[#cbad90] font-normal">FCFA</span></span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Colonne droite */}
        <div className="space-y-6">

          {/* Terrains les + réservés */}
          <div className="bg-[#2c241b] rounded-2xl border border-[#493622] shadow-xl">
            <div className="px-5 py-4 border-b border-[#493622] flex items-center gap-2">
              <Trophy className="w-4 h-4 text-primary" />
              <h3 className="text-sm font-bold text-white">Top terrains</h3>
            </div>
            <div className="p-4 space-y-3">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3">
                    <SkeletonBox w="w-5" h="h-5" className="rounded-full flex-shrink-0" />
                    <SkeletonBox w="w-full" h="h-4" />
                  </div>
                ))
              ) : stats.topFields.length === 0 ? (
                <p className="text-[#cbad90] text-sm text-center py-4">Aucune donnée</p>
              ) : (
                stats.topFields.map((f, i) => {
                  const max = stats.topFields[0]?.count || 1;
                  const pct = Math.round((f.count / max) * 100);
                  const medals = ["🥇", "🥈", "🥉", "4️⃣", "5️⃣"];
                  return (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs text-white font-medium flex items-center gap-1.5">
                          <span>{medals[i]}</span>
                          <span className="truncate max-w-[140px]">{f.name}</span>
                        </span>
                        <span className="text-xs text-[#cbad90] font-bold ml-2">{f.count}</span>
                      </div>
                      <div className="h-1.5 bg-[#493622] rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all duration-500" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* Nouveaux utilisateurs */}
          <div className="bg-[#2c241b] rounded-2xl border border-[#493622] shadow-xl">
            <div className="px-5 py-4 border-b border-[#493622] flex items-center gap-2">
              <Users className="w-4 h-4 text-purple-400" />
              <h3 className="text-sm font-bold text-white">Nouveaux utilisateurs</h3>
            </div>
            <div className="p-4 space-y-3">
              {loading ? (
                Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="animate-pulse flex items-center gap-3">
                    <SkeletonBox w="w-8" h="h-8" className="rounded-full flex-shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <SkeletonBox w="w-3/4" h="h-3" />
                      <SkeletonBox w="w-1/2" h="h-3" />
                    </div>
                  </div>
                ))
              ) : stats.newUsers.length === 0 ? (
                <p className="text-[#cbad90] text-sm text-center py-4">Aucun nouvel utilisateur</p>
              ) : (
                stats.newUsers.map((u) => (
                  <div key={u.id} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 border ${u.role === 'owner' ? 'bg-blue-500/15 text-blue-400 border-blue-500/30' : 'bg-purple-500/15 text-purple-400 border-purple-500/30'}`}>
                      {(u.name || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold text-white truncate">{u.name || "Utilisateur"}</p>
                      <p className="text-xs text-[#cbad90]">{new Date(u.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium border ${u.role === 'owner' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' : 'bg-purple-500/10 text-purple-400 border-purple-500/20'}`}>
                      {u.role}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>

        </div>
      </div>

      {/* ── Activité Admin ── */}
      <div className="bg-[#2c241b] rounded-2xl border border-[#493622] shadow-xl">
        <div className="px-6 py-4 border-b border-[#493622] flex items-center justify-between">
          <h3 className="text-base font-bold text-white flex items-center gap-2">
            <Activity className="w-4 h-4 text-primary" />
            Journal d'activité admin
          </h3>
        </div>
        <div className="p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {logsLoading ? (
            Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-[#231a10] rounded-xl p-4 space-y-2">
                <SkeletonBox h="h-4" w="w-3/4" />
                <SkeletonBox h="h-3" w="w-1/2" />
              </div>
            ))
          ) : logs.length === 0 ? (
            <div className="col-span-4 text-center py-8 text-[#cbad90] text-sm">Aucune action enregistrée.</div>
          ) : (
            logs.map((log) => (
              <div key={log.id} className="bg-[#231a10] rounded-xl p-4 border border-[#493622]/50 hover:border-primary/30 transition-colors">
                <p className="text-xs text-white font-medium leading-snug">{formatAction(log.action)}</p>
                <p className="text-xs text-[#cbad90] mt-1 font-semibold">{log.profiles?.name || "Admin"}</p>
                <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {new Date(log.created_at).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}
