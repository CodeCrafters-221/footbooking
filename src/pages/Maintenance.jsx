import { Wrench, LogOut } from "lucide-react";
import { supabase } from "../services/supabaseClient";

export default function MaintenancePage({ blocked = false }) {
  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = "/login";
  };

  return (
    <div className="min-h-screen bg-background-dark flex items-center justify-center p-6">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-20 h-20 mx-auto rounded-2xl bg-primary/10 border border-primary/30 flex items-center justify-center">
          <Wrench className="w-10 h-10 text-primary" />
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
            {blocked ? "Compte suspendu" : "Maintenance en cours"}
          </h1>
          <p className="text-[#cbad90] text-sm leading-relaxed">
            {blocked
              ? "Votre compte a été restreint par l'administration pour non-respect des règles. Contactez le support si vous pensez qu'il s'agit d'une erreur."
              : "FootBooking est temporairement indisponible pour maintenance. Merci de réessayer plus tard."}
          </p>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-xl border border-[#493622] text-[#cbad90] hover:text-white hover:bg-[#493622]/40 text-sm font-medium transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Se déconnecter
        </button>
      </div>
    </div>
  );
}
