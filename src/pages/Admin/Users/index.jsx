import { useState, useEffect } from "react";
import { Search, UserCheck, UserX, Shield, Mail } from "lucide-react";
import { getAdminUsers, updateUserRole } from "../../../services/adminService";
import { toast } from "react-toastify";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const limit = 10;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, count } = await getAdminUsers(page, limit, search);
      setUsers(data || []);
      setTotalCount(count || 0);
    } catch (err) {
      toast.error("Erreur lors du chargement des utilisateurs");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchUsers();
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [page, search]);

  const handleRoleChange = async (userId, newRole) => {
    try {
      await updateUserRole(userId, newRole);
      setUsers(users.map(u => u.id === userId ? { ...u, role: newRole } : u));
      toast.success(`Rôle mis à jour (${newRole})`);
    } catch (err) {
      toast.error("Erreur lors de la mise à jour du rôle");
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Utilisateurs</h1>
          <p className="text-[#cbad90] mt-1">Gérez tous les profils de l'application. Total: {totalCount}</p>
        </div>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#2c241b] p-4 rounded-2xl border border-[#493622]">
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#cbad90]" />
          <input
            type="text"
            placeholder="Rechercher par nom ou email..."
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
                <th className="p-4 font-medium">Utilisateur</th>
                <th className="p-4 font-medium">Rôle Actuel</th>
                <th className="p-4 font-medium">Inscription</th>
                <th className="p-4 font-medium text-right">Actions / Changer Rôle</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#493622]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-4"><div className="h-10 w-48 bg-[#493622] rounded-lg"></div></td>
                    <td className="p-4"><div className="h-6 w-20 bg-[#493622] rounded-full"></div></td>
                    <td className="p-4"><div className="h-6 w-24 bg-[#493622] rounded"></div></td>
                    <td className="p-4"><div className="h-8 w-32 bg-[#493622] rounded-lg ml-auto"></div></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="4" className="p-8 text-center text-[#cbad90]">
                    Aucun utilisateur trouvé.
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#493622]/30 transition-colors group">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-[#493622] flex items-center justify-center text-white font-bold">
                          {u.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm">{u.name || "Utilisateur"}</p>
                          <p className="text-[#cbad90] text-xs flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" />
                            {u.email}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${
                        u.role === 'super_admin' ? 'bg-purple-500/10 text-purple-400 border-purple-500/20' :
                        u.role === 'owner' ? 'bg-blue-500/10 text-blue-400 border-blue-500/20' :
                        'bg-gray-500/10 text-gray-400 border-gray-500/20'
                      }`}>
                        {u.role === 'super_admin' ? <Shield className="w-3 h-3"/> : u.role === 'owner' ? <UserCheck className="w-3 h-3"/> : <UserX className="w-3 h-3"/>}
                        {u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-[#cbad90] text-sm">
                        {new Date(u.created_at).toLocaleDateString('fr-FR')}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <select 
                        value={u.role || "user"}
                        onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        disabled={u.role === 'super_admin'}
                        className="bg-[#231a10] border border-[#493622] rounded-lg text-white text-sm py-1.5 px-3 focus:outline-none focus:border-primary cursor-pointer disabled:opacity-50"
                      >
                        <option value="user">User</option>
                        <option value="owner">Owner</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
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
