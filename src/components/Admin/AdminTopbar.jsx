import { useAuth } from "../../context/AuthContext";
import { Search, Bell, Menu } from "lucide-react";

export default function AdminTopbar({ toggleSidebar }) {
  const { profile } = useAuth();

  return (
    <header className="h-16 bg-[#2c241b] border-b border-[#493622] flex items-center justify-between px-6 sticky top-0 z-20">
      {/* Left side */}
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 text-[#cbad90] hover:text-white lg:hidden"
        >
          <Menu className="w-6 h-6" />
        </button>
        <div className="relative hidden md:block">
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#cbad90]" />
          <input
            type="text"
            placeholder="Rechercher..."
            className="pl-10 pr-4 py-2 bg-background-dark border border-[#493622] rounded-lg text-white text-sm focus:outline-none focus:border-primary w-64"
          />
        </div>
      </div>

      {/* Right side */}
      <div className="flex items-center gap-6">
        <button className="relative text-[#cbad90] hover:text-white">
          <Bell className="w-6 h-6" />
          <span className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>
        
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <p className="text-sm font-semibold text-white">
              {profile?.name || "Super Admin"}
            </p>
            <p className="text-xs text-[#cbad90] capitalize">{profile?.role}</p>
          </div>
          <div className="w-10 h-10 rounded-full bg-primary/20 border border-primary flex items-center justify-center text-primary font-bold">
            {profile?.name?.charAt(0) || "A"}
          </div>
        </div>
      </div>
    </header>
  );
}
