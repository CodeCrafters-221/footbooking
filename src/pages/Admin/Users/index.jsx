import { useState, useEffect } from "react";
import {
  Search,
  UserCheck,
  UserX,
  Shield,
  Mail,
  Ban,
  Unlock,
} from "lucide-react";
import {
  getAdminUsers,
  updateUserRole,
  blockUser,
  unblockUser,
} from "../../../services/adminService";
import { toast } from "react-toastify";
import ConfirmModal from "../../../components/Admin/ConfirmModal";

export default function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [search, setSearch] = useState("");
  const [confirmModal, setConfirmModal] = useState({
    open: false,
    user: null,
    action: null,
  });
  const [actionLoading, setActionLoading] = useState(false);
  const limit = 10;

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const { data, count } = await getAdminUsers(page, limit, search);
      setUsers(data || []);
      setTotalCount(count || 0);
    } catch {
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
    const target = users.find((u) => u.id === userId);
    if (target?.role === "blocked") {
      toast.error("Débloquez l'utilisateur avant de changer son rôle.");
      return;
    }
    if (target?.role === "super_admin") {
      toast.error("Impossible de modifier un super admin.");
      return;
    }
    try {
      await updateUserRole(userId, newRole);
      setUsers(users.map((u) => (u.id === userId ? { ...u, role: newRole } : u)));
      toast.success(`Rôle mis à jour (${newRole})`);
    } catch {
      toast.error("Erreur lors de la mise à jour du rôle");
    }
  };

  const openBlockConfirm = (user, action) => {
    setConfirmModal({ open: true, user, action });
  };

  const handleBlockConfirm = async () => {
    const { user, action } = confirmModal;
    if (!user) return;
    setActionLoading(true);
    try {
      if (action === "block") {
        await blockUser(user.id, user.role);
        setUsers((prev) =>
          prev.map((u) => (u.id === user.id ? { ...u, role: "blocked" } : u)),
        );
        toast.success(`${user.name || "Utilisateur"} a été bloqué`);
      } else {
        const restored = await unblockUser(user.id);
        setUsers((prev) =>
          prev.map((u) =>
            u.id === user.id ? { ...u, role: restored || "user" } : u,
          ),
        );
        toast.success(`${user.name || "Utilisateur"} a été débloqué`);
      }
      setConfirmModal({ open: false, user: null, action: null });
    } catch (err) {
      toast.error(err.message || "Action impossible");
    } finally {
      setActionLoading(false);
    }
  };

  const totalPages = Math.ceil(totalCount / limit);

  const roleBadge = (role) => {
    if (role === "super_admin") {
      return "bg-purple-500/10 text-purple-400 border-purple-500/20";
    }
    if (role === "owner") {
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    }
    if (role === "blocked") {
      return "bg-red-500/10 text-red-400 border-red-500/20";
    }
    return "bg-gray-500/10 text-gray-400 border-gray-500/20";
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Utilisateurs</h1>
          <p className="text-[#cbad90] mt-1">
            Gérez tous les profils de l&apos;application. Total: {totalCount}
          </p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row gap-4 justify-between items-center bg-[#2c241b] p-4 rounded-2xl border border-[#493622]">
        <div className="relative w-full md:w-96">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#cbad90]" />
          <input
            type="text"
            placeholder="Rechercher par nom..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full pl-10 pr-4 py-2.5 bg-[#231a10] border border-[#493622] rounded-xl text-white text-sm focus:outline-none focus:border-primary transition-colors"
          />
        </div>
      </div>

      <div className="bg-[#2c241b] border border-[#493622] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[720px]">
            <thead>
              <tr className="bg-[#231a10]/50 border-b border-[#493622] text-[#cbad90] text-xs uppercase tracking-wider">
                <th className="p-4 font-medium">Utilisateur</th>
                <th className="p-4 font-medium">Statut / Rôle</th>
                <th className="p-4 font-medium">Inscription</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#493622]">
              {loading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="animate-pulse">
                    <td className="p-4"><div className="h-10 w-48 bg-[#493622] rounded-lg" /></td>
                    <td className="p-4"><div className="h-6 w-20 bg-[#493622] rounded-full" /></td>
                    <td className="p-4"><div className="h-6 w-24 bg-[#493622] rounded" /></td>
                    <td className="p-4"><div className="h-8 w-40 bg-[#493622] rounded-lg ml-auto" /></td>
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={4} className="p-12 text-center text-[#cbad90]">
                    <UserX className="w-10 h-10 mx-auto mb-3 opacity-40" />
                    <p className="font-medium text-white">Aucun utilisateur trouvé</p>
                  </td>
                </tr>
              ) : (
                users.map((u) => (
                  <tr key={u.id} className="hover:bg-[#493622]/30 transition-colors">
                    <td className="p-4">
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center text-white font-bold ${
                            u.role === "blocked" ? "bg-red-500/20 border border-red-500/30" : "bg-[#493622]"
                          }`}
                        >
                          {u.name?.charAt(0) || "U"}
                        </div>
                        <div>
                          <p className="text-white font-bold text-sm">{u.name || "Utilisateur"}</p>
                          <p className="text-[#cbad90] text-xs flex items-center gap-1 mt-0.5">
                            <Mail className="w-3 h-3" />
                            {u.email || "—"}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-xs font-medium border ${roleBadge(u.role)}`}
                      >
                        {u.role === "super_admin" ? (
                          <Shield className="w-3 h-3" />
                        ) : u.role === "owner" ? (
                          <UserCheck className="w-3 h-3" />
                        ) : u.role === "blocked" ? (
                          <Ban className="w-3 h-3" />
                        ) : (
                          <UserX className="w-3 h-3" />
                        )}
                        {u.role === "blocked" ? "Bloqué" : u.role}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className="text-[#cbad90] text-sm">
                        {new Date(u.created_at).toLocaleDateString("fr-FR")}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col sm:flex-row items-end sm:items-center justify-end gap-2">
                        {u.role !== "super_admin" && (
                          <>
                            {u.role === "blocked" ? (
                              <button
                                type="button"
                                onClick={() => openBlockConfirm(u, "unblock")}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-green-500/10 text-green-400 border border-green-500/20 hover:bg-green-500/20"
                              >
                                <Unlock className="w-3.5 h-3.5" />
                                Débloquer
                              </button>
                            ) : (
                              <button
                                type="button"
                                onClick={() => openBlockConfirm(u, "block")}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20"
                              >
                                <Ban className="w-3.5 h-3.5" />
                                Bloquer
                              </button>
                            )}
                            <select
                              value={u.role === "blocked" ? "user" : u.role || "user"}
                              onChange={(e) => handleRoleChange(u.id, e.target.value)}
                              disabled={u.role === "blocked"}
                              className="bg-[#231a10] border border-[#493622] rounded-lg text-white text-sm py-1.5 px-3 focus:outline-none focus:border-primary cursor-pointer disabled:opacity-50"
                            >
                              <option value="user">User</option>
                              <option value="owner">Owner</option>
                            </select>
                          </>
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
          confirmModal.action === "block"
            ? "Bloquer l'utilisateur"
            : "Débloquer l'utilisateur"
        }
        message={
          confirmModal.action === "block"
            ? `Bloquer ${confirmModal.user?.name || "cet utilisateur"} ? Il ne pourra plus accéder à la plateforme.`
            : `Rétablir l'accès pour ${confirmModal.user?.name || "cet utilisateur"} ?`
        }
        confirmLabel={confirmModal.action === "block" ? "Bloquer" : "Débloquer"}
        variant={confirmModal.action === "block" ? "danger" : "primary"}
        loading={actionLoading}
        onConfirm={handleBlockConfirm}
        onCancel={() => setConfirmModal({ open: false, user: null, action: null })}
      />
    </div>
  );
}
