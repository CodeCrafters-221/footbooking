import { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import {
  LandPlot,
  Users,
  CalendarCheck,
  PartyPopper,
} from "lucide-react";
import { Link } from "react-router-dom";
import heroBg from "../assets/img/hero-bg.jpg";
import { supabase } from "../services/supabaseClient";

export default function Hero() {
  const [isVisible, setIsVisible] = useState(false);
  const [dynamicStats, setDynamicStats] = useState([
    {
      icon: <LandPlot className="w-8 h-8 text-primary" />,
      value: "...",
      label: "Terrains disponibles",
    },
    {
      icon: <Users className="w-8 h-8 text-primary" />,
      value: "...",
      label: "Joueurs actifs",
    },
    {
      icon: <CalendarCheck className="w-8 h-8 text-primary" />,
      value: "...",
      label: "Réservations totales",
    },
  ]);

  const { user: currentUser, profile } = useAuth();

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsVisible(true);
    }, 100);

    const fetchDynamicStats = async () => {
      try {
        // Tentative d'utiliser une fonction RPC sécurisée pour contourner le RLS
        const { data: rpcData, error: rpcError } = await supabase.rpc('get_platform_stats');

        let fieldsCount = 0;
        let usersCount = 0;
        let reservationsCount = 0;

        if (!rpcError && rpcData) {
          fieldsCount = rpcData.terrains;
          usersCount = rpcData.joueurs;
          reservationsCount = rpcData.reservations;
        } else {
          // Fallback direct (qui renverra 0 si bloqué par le RLS)
          const { count: fCount } = await supabase.from("fields").select("*", { count: "exact", head: true });
          const { count: uCount } = await supabase.from("profiles").select("*", { count: "exact", head: true }).eq("role", "client");
          const { count: rCount } = await supabase.from("reservations").select("*", { count: "exact", head: true });
          
          fieldsCount = fCount || 0;
          usersCount = uCount || 0;
          reservationsCount = rCount || 0;
        }

        setDynamicStats([
          {
            icon: <LandPlot className="w-8 h-8 text-primary" />,
            value: fieldsCount ? `${fieldsCount}` : "0",
            label: "Terrains disponibles",
          },
          {
            icon: <Users className="w-8 h-8 text-primary" />,
            value: usersCount ? `${usersCount}` : "0",
            label: "Joueurs actifs",
          },
          {
            icon: <CalendarCheck className="w-8 h-8 text-primary" />,
            value: reservationsCount ? `${reservationsCount}` : "0",
            label: "Réservations totales",
          },
        ]);
      } catch (error) {
        console.error("Erreur lors de la récupération des statistiques:", error);
      }
    };

    fetchDynamicStats();

    return () => clearTimeout(timer);
  }, []);

  const badgeClasse = "inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 animate-pulse mt-6 cursor-pointer"

  return (
    <div 
      className="heroSection relative overflow-hidden bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${heroBg})` }}
    >
      {/* Superpositions dégradées pour faire ressortir le texte */}
      <div className="absolute inset-0 bg-black/40 z-0" />
      <div className="absolute inset-0 bg-gradient-to-t from-background-dark via-background-dark/60 to-transparent z-0 pointer-events-none" />
      <div className="absolute inset-0 bg-gradient-to-b from-background-dark/80 via-transparent to-transparent z-0 pointer-events-none" />

      <div className={`relative z-10 flex flex-col items-center justify-start lg:justify-center min-h-[70vh] lg:min-h-[85vh] w-full px-5 pt-32 pb-16 lg:px-40 transition-all duration-1000 ${isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-10"}`}>
        {/* Titre */}
        <h1
          className={`text-white text-4xl text-center font-black leading-tight tracking-[-0.033em] md:text-5xl lg:text-6xl max-w-3xl mx-auto px-2 md:p-4 transition-all duration-700 delay-200 ${isVisible ? "opacity-100 scale-100" : "opacity-0 scale-95"}`}
        >
          Le Meilleur Terrain.
          <br />
          <span className="text-primary relative mt-1 md:mt-2 block">
            Votre Meilleur Match.
            <span className="absolute bottom-1 left-0 w-full h-1.5 bg-primary/30 blur-sm" />
          </span>
        </h1>

        <h2 className={`text-gray-200 text-center tracking-tight text-base font-lexend leading-normal md:text-xl max-w-2xl mx-auto transition-all duration-700 delay-300 ${isVisible ? "opacity-100" : "opacity-0"}`}
        >
          La première plateforme de réservation de terrains de football à Dakar.
        </h2>

        {/* Badge */}
        <Link to={currentUser ? (profile?.role === "owner" ? "/dashboard" : "/search") : "/login"} className={badgeClasse}>
          <PartyPopper className="text-primary size-4" />
          <span className="text-primary text-sm font-semibold text-center">
            {currentUser ? (profile?.role === "owner" ? "Accéder au Dashboard" : "Envie de jouer? - Réservez maintenant !") : "Envie de jouer? - Connectez-vous pour réserver !"}
          </span>
        </Link>

        {/* Statistiques */}
        <HeroStats stats={dynamicStats} />
      </div>
    </div>
  );
}

const HeroStats = ({ stats }) => {

  return (
    <div className="grid grid-cols-3 gap-4 mt-5 w-full max-w-4xl">      
      {stats && stats.map((stat) => (
        <div
          key={stat.label}
          className="bg-[#342618]/80 backdrop-blur-sm border border-[#493622] rounded-2xl p-3 md:p-4 flex flex-col items-center justify-center"
        >
          {stat.icon}
          <p className="text-white text-lg font-semibold mt-2">
            {stat.value}
          </p>
          <p className="text-gray-400 text-sm text-center">{stat.label}</p>
        </div>
      ))}
    </div>
  )
}