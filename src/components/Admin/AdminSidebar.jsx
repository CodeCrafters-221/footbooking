import { NavLink } from "react-router-dom";
import { 
  LayoutDashboard, 
  Map, 
  CalendarCheck, 
  Users, 
  Briefcase, 
  Settings,
  LogOut,
  X,
  Flag,
} from "lucide-react";
import { supabase } from "../../services/supabaseClient";

export default function AdminSidebar({ isOpen, toggleSidebar }) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  const navLinks = [
    { name: "Dashboard", path: "/admin", icon: LayoutDashboard, exact: true },
    { name: "Terrains", path: "/admin/terrains", icon: Map },
    { name: "Réservations", path: "/admin/reservations", icon: CalendarCheck },
    { name: "Utilisateurs", path: "/admin/utilisateurs", icon: Users },
    { name: "Propriétaires", path: "/admin/proprietaires", icon: Briefcase },
    { name: "Signalements", path: "/admin/signalements", icon: Flag },
    { name: "Paramètres", path: "/admin/parametres", icon: Settings },
  ];

  return (
    <>
      {/* Overlay pour mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={toggleSidebar}
        />
      )}

      {/* Sidebar */}
      <aside className={`
        fixed lg:static inset-y-0 left-0 z-40
        w-64 bg-[#2c241b] border-r border-[#493622]
        flex flex-col transition-transform duration-300 ease-in-out
        ${isOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
      `}>
        {/* Logo */}
        <div className="h-16 flex items-center justify-between px-6 border-b border-[#493622]">
          <NavLink to="/admin" className="text-xl font-bold text-white flex items-center gap-2">
            <span className="text-primary">FB</span>Admin
          </NavLink>
          <button onClick={toggleSidebar} className="lg:hidden text-[#cbad90] hover:text-white">
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-2">
          {navLinks.map((link) => (
            <NavLink
              key={link.path}
              to={link.path}
              end={link.exact}
              className={({ isActive }) => `
                flex items-center gap-3 px-4 py-3 rounded-xl transition-colors
                ${isActive 
                  ? "bg-primary/10 text-primary font-medium" 
                  : "text-[#cbad90] hover:bg-[#493622]/50 hover:text-white"
                }
              `}
              onClick={() => {
                if (window.innerWidth < 1024) toggleSidebar();
              }}
            >
              <link.icon className="w-5 h-5" />
              {link.name}
            </NavLink>
          ))}
        </nav>

        {/* Logout */}
        <div className="p-4 border-t border-[#493622]">
          <button 
            onClick={handleLogout}
            className="flex items-center gap-3 px-4 py-3 w-full rounded-xl text-[#cbad90] hover:bg-red-500/10 hover:text-red-500 transition-colors"
          >
            <LogOut className="w-5 h-5" />
            Déconnexion
          </button>
        </div>
      </aside>
    </>
  );
}
