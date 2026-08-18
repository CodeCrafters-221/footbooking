import { useState, useRef, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useAdminNotifications } from "../../hooks/useAdminNotifications";
import { globalAdminSearch } from "../../services/adminService";
import { Search, Bell, Menu, MapPin, User, CalendarCheck, Briefcase, Loader2 } from "lucide-react";

export default function AdminTopbar({ toggleSidebar }) {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const {
    notifications,
    unreadCount,
    loading: notifLoading,
    markAsRead,
    markAllRead,
  } = useAdminNotifications();

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const [showNotifs, setShowNotifs] = useState(false);

  const searchRef = useRef(null);
  const notifRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target)) {
        setShowSearch(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target)) {
        setShowNotifs(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults(null);
      return;
    }

    const timer = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const results = await globalAdminSearch(searchQuery);
        setSearchResults(results);
        setShowSearch(true);
      } catch {
        setSearchResults({ users: [], fields: [], bookings: [], owners: [] });
      } finally {
        setSearchLoading(false);
      }
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const goTo = useCallback(
    (path) => {
      setShowSearch(false);
      setSearchQuery("");
      setSearchResults(null);
      navigate(path);
    },
    [navigate],
  );

  const handleNotifClick = (notif) => {
    markAsRead(notif.id);
    setShowNotifs(false);
    if (notif.link) navigate(notif.link);
  };

  const hasResults =
    searchResults &&
    (searchResults.users?.length > 0 ||
      searchResults.fields?.length > 0 ||
      searchResults.bookings?.length > 0 ||
      searchResults.owners?.length > 0);

  const formatRelativeTime = (iso) => {
    if (!iso) return "";
    const diff = Date.now() - new Date(iso).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 60) return `Il y a ${mins} min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `Il y a ${hours} h`;
    return new Date(iso).toLocaleDateString("fr-FR");
  };

  return (
    <header className="h-16 bg-[#2c241b] border-b border-[#493622] flex items-center justify-between px-4 sm:px-6 sticky top-0 z-20">
      <div className="flex items-center gap-4 flex-1 min-w-0">
        <button
          type="button"
          onClick={toggleSidebar}
          className="p-2 text-[#cbad90] hover:text-white lg:hidden shrink-0"
        >
          <Menu className="w-6 h-6" />
        </button>

        <div className="relative flex-1 max-w-md" ref={searchRef}>
          <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-[#cbad90]" />
          <input
            type="text"
            placeholder="Utilisateurs, terrains, réservations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => searchQuery.length >= 2 && setShowSearch(true)}
            className="w-full pl-10 pr-10 py-2 bg-background-dark border border-[#493622] rounded-lg text-white text-sm focus:outline-none focus:border-primary"
          />
          {searchLoading && (
            <Loader2 className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-primary animate-spin" />
          )}

          {showSearch && searchQuery.length >= 2 && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[#2c241b] border border-[#493622] rounded-xl shadow-2xl max-h-96 overflow-y-auto z-50">
              {!hasResults && !searchLoading ? (
                <p className="p-4 text-sm text-[#cbad90] text-center">Aucun résultat</p>
              ) : (
                <div className="p-2 space-y-3">
                  {searchResults?.users?.length > 0 && (
                    <SearchSection title="Utilisateurs" icon={User}>
                      {searchResults.users.map((u) => (
                        <button
                          key={u.id}
                          type="button"
                          onClick={() => goTo("/admin/utilisateurs")}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#493622]/50 text-sm text-white"
                        >
                          {u.name || "Sans nom"}{" "}
                          <span className="text-[#cbad90] text-xs">({u.role})</span>
                        </button>
                      ))}
                    </SearchSection>
                  )}
                  {searchResults?.fields?.length > 0 && (
                    <SearchSection title="Terrains" icon={MapPin}>
                      {searchResults.fields.map((f) => (
                        <button
                          key={f.id}
                          type="button"
                          onClick={() => goTo("/admin/terrains")}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#493622]/50 text-sm text-white"
                        >
                          {f.name}
                          <span className="text-[#cbad90] text-xs block truncate">
                            {f.adress}
                          </span>
                        </button>
                      ))}
                    </SearchSection>
                  )}
                  {searchResults?.bookings?.length > 0 && (
                    <SearchSection title="Réservations" icon={CalendarCheck}>
                      {searchResults.bookings.map((b) => (
                        <button
                          key={b.id}
                          type="button"
                          onClick={() => goTo("/admin/reservations")}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#493622]/50 text-sm text-white"
                        >
                          {b.client_name || "Client"} — {b.fields?.name}
                          <span className="text-[#cbad90] text-xs block">{b.status}</span>
                        </button>
                      ))}
                    </SearchSection>
                  )}
                  {searchResults?.owners?.length > 0 && (
                    <SearchSection title="Propriétaires" icon={Briefcase}>
                      {searchResults.owners.map((o) => (
                        <button
                          key={o.id}
                          type="button"
                          onClick={() => goTo("/admin/proprietaires")}
                          className="w-full text-left px-3 py-2 rounded-lg hover:bg-[#493622]/50 text-sm text-white"
                        >
                          {o.name}
                          <span className="text-[#cbad90] text-xs block">{o.phone}</span>
                        </button>
                      ))}
                    </SearchSection>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="flex items-center gap-4 sm:gap-6 shrink-0">
        <div className="relative" ref={notifRef}>
          <button
            type="button"
            onClick={() => setShowNotifs(!showNotifs)}
            className="relative text-[#cbad90] hover:text-white p-1"
            aria-label="Notifications"
          >
            <Bell className="w-6 h-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] px-1 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {showNotifs && (
            <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-[#2c241b] border border-[#493622] rounded-2xl shadow-2xl overflow-hidden z-50">
              <div className="p-4 border-b border-[#493622] flex justify-between items-center bg-[#231a10]/50">
                <h3 className="text-white font-bold text-sm">Notifications</h3>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={markAllRead}
                    className="text-xs text-primary font-semibold hover:underline"
                  >
                    Tout marquer lu
                  </button>
                )}
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifLoading ? (
                  Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="p-4 border-b border-[#493622]/30 animate-pulse">
                      <div className="h-4 w-3/4 bg-[#493622] rounded mb-2" />
                      <div className="h-3 w-full bg-[#493622]/50 rounded" />
                    </div>
                  ))
                ) : notifications.length === 0 ? (
                  <p className="p-6 text-center text-sm text-[#cbad90]">
                    Aucune notification
                  </p>
                ) : (
                  notifications.map((notif) => (
                    <button
                      key={notif.id}
                      type="button"
                      onClick={() => handleNotifClick(notif)}
                      className={`w-full text-left p-4 border-b border-[#493622]/30 hover:bg-[#493622]/30 transition-colors ${
                        !notif.read ? "bg-primary/5" : ""
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {!notif.read && (
                          <span className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="text-white text-sm font-semibold">{notif.title}</p>
                          <p className="text-[#cbad90] text-xs mt-0.5 line-clamp-2">
                            {notif.message}
                          </p>
                          <p className="text-[10px] text-gray-500 mt-1">
                            {formatRelativeTime(notif.createdAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

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

function SearchSection({ title, icon: Icon, children }) {
  return (
    <div>
      <p className="px-3 py-1 text-[10px] font-black uppercase tracking-wider text-[#cbad90] flex items-center gap-1">
        <Icon className="w-3 h-3" />
        {title}
      </p>
      {children}
    </div>
  );
}
