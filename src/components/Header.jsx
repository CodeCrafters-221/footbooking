import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import mainLogo from "../assets/img/mainLogo.png";
import { useAuth } from "../context/AuthContext";
import { Menu as MenuIcon, X as XIcon, User as UserIcon, LogOut } from "lucide-react";
import { supabase } from "../services/supabaseClient";

export default function Header() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  const handleLogout = async () => {
    setIsMenuOpen(false);
    await supabase.auth.signOut();
    navigate("/");
  };

  // 👇 Detecter un scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <>
      <header
        className={`
        fixed top-0 left-0 w-full z-50 transition-all duration-300 flex items-center justify-around py-3
        ${
          scrolled
            ? "bg-background-dark lg:bg-background-dark/95 backdrop-blur-none lg:backdrop-blur border-b border-white/5 shadow-lg"
            : "bg-transparent"
        }
      `}
      >
        <div className="max-w-350 mx-auto ">
          <div className="flex items-center justify-between gap-4 h-20">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-3 group">
              <h2 className="text-2xl font-display font-bold text-white tracking-wide group-hover:text-primary/90 transition-colors">
                {mainLogo ? (
                  <img
                    src={mainLogo}
                    alt="Logo"
                    className="h-34 object-contain "
                  />
                ) : (
                  "Footbooking"
                )}
              </h2>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center gap-8">
              {profile?.role !== "owner" && (
                <>
                  <Link
                    className="text-white/90 hover:text-primary text-sm font-medium transition-colors relative group py-2"
                    to="/"
                  >
                    Accueil
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                  </Link>

                  <Link
                    className="text-white/90 hover:text-primary text-sm font-medium transition-colors relative group py-2"
                    to="/search"
                  >
                    Trouver un terrain
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                </>
              )}

              {user ? (
                profile?.role === "owner" ? (
                  <Link
                    className="text-white font-bold bg-primary/20 border border-primary/30 px-4 py-1.5 rounded-full hover:bg-primary hover:text-black transition-all text-sm"
                    to="/dashboard"
                  >
                    Mon Dashboard
                  </Link>
                ) : (
                  <Link
                    className="text-white/90 hover:text-primary text-sm font-medium transition-colors relative group py-2"
                    to="/owners"
                  >
                    Devenir partenaire
                    <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                  </Link>
                )
              ) : (
                <Link
                  className="text-white/90 hover:text-primary text-sm font-medium transition-colors relative group py-2"
                  to="/owners"
                >
                  Pour les propriétaires
                  <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full"></span>
                </Link>
              )}
            </nav>

            {/* Desktop Auth */}
            <div className="hidden lg:flex items-center gap-4">
              {user ? (
                <Link
                  to={
                    profile?.role === "owner" ? "/dashboard/compte" : "/compte"
                  }
                  className="flex items-center text-white hover:text-primary transition-colors font-medium border border-white/10 rounded-full  hover:bg-white/5"
                >
                  <img
                    src={
                      profile?.image ||
                      "https://imgs.search.brave.com/SU6DjXUVoDrdq7vpMSVNfbUFdVDH5Po5Tp5hxoZmMRg/rs:fit:500:0:1:0/g:ce/aHR0cHM6Ly9jZG4u/dmVjdG9yc3RvY2su/Y29tL2kvNTAwcC84/Mi8wOC9tYWxlLWFu/ZC1mZW1hbGUtcHJv/ZmlsZS1zaWxob3Vl/dHRlcy12ZWN0b3It/Mzg1NzgyMDguanBn"
                    }
                    className="size-12 object-cover rounded-full border-2 border-primary"
                  />
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="bg-primary hover:bg-[#d96f0b] text-background-dark font-bold text-sm px-6 py-2.5 rounded-full transition-all shadow-[0_0_15px_rgba(242,127,13,0.3)] hover:shadow-[0_0_20px_rgba(242,127,13,0.5)] transform hover:-translate-y-0.5"
                >
                  Se connecter
                </Link>
              )}
            </div>

            {/* Mobile toggle */}
            <button
              className="lg:hidden p-2 text-white hover:bg-white/10 rounded-full transition-colors z-50 relative"
              onClick={() => setIsMenuOpen(!isMenuOpen)}
            >
              {isMenuOpen ? (
                <XIcon className="w-8 h-8" />
              ) : (
                <MenuIcon className="w-8 h-8" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu Overlay */}
        <div
          className={`fixed inset-0 bg-background-dark z-999 lg:hidden transition-all duration-300 flex flex-col pt-24 px-6 gap-8 ${
            isMenuOpen
              ? "opacity-100 visible"
              : "opacity-0 invisible pointer-events-none"
          }`}
        >
          <XIcon className="w-8 h-8 absolute top-5 right-5 hover:opacity-20" color="white" onClick={() => setIsMenuOpen(false)} />
          <nav className="flex flex-col gap-6 items-center w-full">
            {profile?.role !== "owner" && (
              <>
                <Link
                  className="text-white text-2xl font-bold hover:text-primary transition-colors flex items-center gap-3 w-full justify-center p-2"
                  to="/"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Accueil
                </Link>
                <Link
                  className="text-white text-2xl font-bold hover:text-primary transition-colors flex items-center gap-3 w-full justify-center p-2"
                  to="/search"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Trouver un terrain
                </Link>
              </>
            )}
            {user ? (
              profile?.role === "owner" ? (
                <Link
                  className="text-primary text-2xl font-bold transition-colors flex items-center gap-3 w-full justify-center p-2"
                  to="/dashboard"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Mon Dashboard
                </Link>
              ) : (
                <Link
                  className="text-white text-2xl font-bold hover:text-primary transition-colors flex items-center gap-3 w-full justify-center p-2"
                  to="/owners"
                  onClick={() => setIsMenuOpen(false)}
                >
                  Devenir partenaire
                </Link>
              )
            ) : (
              <Link
                className="text-white text-2xl font-bold hover:text-primary transition-colors flex items-center gap-3 w-full justify-center p-2"
                to="/owners"
                onClick={() => setIsMenuOpen(false)}
              >
                Pour les propriétaires
              </Link>
            )}
          </nav>

          <div className="mt-auto mb-10 w-full flex flex-col gap-4">
            {user ? (
              <>
                <Link
                  to={
                    profile?.role === "owner" ? "/dashboard/compte" : "/compte"
                  }
                  className="w-full bg-surface-highlight hover:bg-surface-highlight/80 text-white font-bold text-lg h-14 rounded-2xl flex items-center justify-center gap-2 transition-all"
                  onClick={() => setIsMenuOpen(false)}
                >
                  <UserIcon className="w-6 h-6" />
                  {profile?.name || "Compte"}
                </Link>
                <button
                  onClick={handleLogout}
                  className="w-full border-2 border-red-500/20 hover:border-red-500/40 text-red-500 hover:text-red-400 hover:bg-red-500/10 font-bold text-lg h-14 rounded-2xl flex items-center justify-center gap-2 transition-all"
                >
                  <LogOut className="w-6 h-6" />
                  Se déconnecter
                </button>
              </>
            ) : (
              <Link
                to="/login"
                className="w-full bg-primary hover:bg-[#d96f0b] text-background-dark font-bold text-lg h-14 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 transition-all"
                onClick={() => setIsMenuOpen(false)}
              >
                Se connecter
              </Link>
            )}
          </div>
        </div>
      </header>
    </>
  );
}
