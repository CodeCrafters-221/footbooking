import { useState, useEffect } from "react";
import { 
  Users, 
  Map, 
  CalendarCheck, 
  TrendingUp, 
  Activity,
  RefreshCw,
  Clock
} from "lucide-react";
import { getAdminStats, getRecentAdminLogs } from "../../../services/adminService";
import { toast } from "react-toastify";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from "recharts";

const MOCK_REVENUE_DATA = [
  { name: 'Jan', value: 4000 },
  { name: 'Fév', value: 3000 },
  { name: 'Mar', value: 5000 },
  { name: 'Avr', value: 4500 },
  { name: 'Mai', value: 6000 },
  { name: 'Juin', value: 7000 },
];

export default function AdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(true);
  const [logs, setLogs] = useState([]);
  const [stats, setStats] = useState({
    totalFields: 0,
    totalUsers: 0,
    totalBookings: 0,
    totalRevenue: 0
  });

  const fetchDashboardData = async () => {
    setLoading(true);
    setLogsLoading(true);
    try {
      const [statsData, logsData] = await Promise.all([
        getAdminStats(),
        getRecentAdminLogs(5)
      ]);
      setStats(statsData);
      setLogs(logsData);
    } catch (err) {
      toast.error("Erreur lors du chargement des données.");
    } finally {
      setLoading(false);
      setLogsLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const statCards = [
    { title: "Total Terrains", value: stats.totalFields, icon: Map, color: "text-blue-500", bg: "bg-blue-500/10" },
    { title: "Réservations", value: stats.totalBookings, icon: CalendarCheck, color: "text-green-500", bg: "bg-green-500/10" },
    { title: "Revenus (FCFA)", value: stats.totalRevenue.toLocaleString(), icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
    { title: "Utilisateurs Inscrits", value: stats.totalUsers, icon: Users, color: "text-purple-500", bg: "bg-purple-500/10" },
  ];

  const formatAction = (action) => {
    const map = {
      'activated_field': 'a activé le terrain',
      'deactivated_field': 'a désactivé le terrain',
      'soft_deleted_field': 'a supprimé le terrain',
      'changed_role_to_owner': 'a promu propriétaire',
      'changed_role_to_super_admin': 'a promu super-admin',
      'changed_role_to_user': 'a rétrogradé en user'
    };
    return map[action] || action;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard Super Admin</h1>
          <p className="text-[#cbad90] mt-1">Vue d'ensemble de la plateforme Footbooking.</p>
        </div>
        <button 
          onClick={fetchDashboardData}
          className="flex items-center gap-2 px-4 py-2 bg-[#2c241b] border border-[#493622] rounded-xl text-white hover:bg-[#493622] transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Actualiser
        </button>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((stat, i) => (
          <div key={i} className="bg-[#2c241b] p-6 rounded-2xl border border-[#493622] flex items-center gap-4 shadow-xl hover:-translate-y-1 transition-transform">
            <div className={`p-4 rounded-xl ${stat.bg} ${stat.color}`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-sm font-medium text-[#cbad90]">{stat.title}</p>
              {loading ? (
                <div className="h-8 w-20 bg-[#493622] animate-pulse rounded mt-1"></div>
              ) : (
                <p className="text-2xl font-bold text-white mt-1">{stat.value}</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Charts */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-[#2c241b] p-6 rounded-2xl border border-[#493622] shadow-xl">
            <h2 className="text-lg font-bold text-white mb-6">Évolution des Revenus</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height={300}>
                <AreaChart data={MOCK_REVENUE_DATA} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f27f0d" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#f27f0d" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" vertical={false} />
                  <XAxis dataKey="name" stroke="#888" tickLine={false} axisLine={false} />
                  <YAxis stroke="#888" tickLine={false} axisLine={false} tickFormatter={(value) => `${value / 1000}k`} />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#1f160e', borderColor: '#493622', color: '#fff', borderRadius: '12px' }}
                    itemStyle={{ color: '#f27f0d' }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#f27f0d" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-[#2c241b] p-6 rounded-2xl border border-[#493622] shadow-xl h-full flex flex-col">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-bold text-white">Activité Récente</h2>
            <Activity className="w-5 h-5 text-primary" />
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-4">
            {logsLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="animate-pulse flex gap-3">
                  <div className="w-8 h-8 bg-[#493622] rounded-full flex-shrink-0"></div>
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-[#493622] rounded w-3/4"></div>
                    <div className="h-3 bg-[#493622] rounded w-1/2"></div>
                  </div>
                </div>
              ))
            ) : logs.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-[#cbad90] text-sm border-2 border-dashed border-[#493622] rounded-xl p-8">
                <p className="text-center">Aucune activité enregistrée.</p>
              </div>
            ) : (
              logs.map((log) => (
                <div key={log.id} className="flex gap-3 border-b border-[#493622]/50 pb-4 last:border-0">
                  <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center flex-shrink-0 font-bold text-xs border border-primary/30">
                    {log.profiles?.name?.charAt(0) || "A"}
                  </div>
                  <div>
                    <p className="text-sm text-white">
                      <span className="font-semibold text-[#cbad90]">{log.profiles?.name || "Admin"}</span>{" "}
                      {formatAction(log.action)}{" "}
                      <span className="text-gray-400">({log.target_table})</span>
                    </p>
                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {new Date(log.created_at).toLocaleString('fr-FR', { 
                        day: '2-digit', month: 'short', hour: '2-digit', minute:'2-digit' 
                      })}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
