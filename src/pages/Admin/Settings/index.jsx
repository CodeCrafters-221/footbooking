import { useState, useEffect } from "react";
import { Settings2, Save, CreditCard, Shield, Globe } from "lucide-react";
import { toast } from "react-toastify";
import { usePlatform } from "../../../context/PlatformContext";
import { logAdminAction } from "../../../services/adminService";

export default function AdminSettings() {
  const { maintenanceMode, setMaintenanceMode } = usePlatform();
  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState({
    platformFee: "5",
    allowNewRegistrations: true,
    contactEmail: "contact@footbooking.com",
  });

  useEffect(() => {
    try {
      const saved = localStorage.getItem("footbooking_admin_settings");
      if (saved) {
        setSettings((prev) => ({ ...prev, ...JSON.parse(saved) }));
      }
    } catch {
      /* ignore */
    }
  }, []);

  const handleChange = (e) => {
    const value =
      e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setSettings({ ...settings, [e.target.name]: value });
  };

  const handleMaintenanceToggle = (e) => {
    const enabled = e.target.checked;
    setMaintenanceMode(enabled);
    logAdminAction(
      enabled ? "enabled_maintenance" : "disabled_maintenance",
      "platform",
      null,
      { enabled },
    );
    toast.info(
      enabled
        ? "Mode maintenance activé — seuls les super admins ont accès."
        : "Mode maintenance désactivé.",
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      localStorage.setItem(
        "footbooking_admin_settings",
        JSON.stringify(settings),
      );
      await logAdminAction("updated_platform_settings", "platform", null, settings);
      toast.success("Paramètres enregistrés avec succès !");
    } catch {
      toast.error("Erreur lors de l'enregistrement");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Settings2 className="w-7 h-7 text-primary" />
            Paramètres Plateforme
          </h1>
          <p className="text-[#cbad90] mt-1">Configuration globale de Footbooking.</p>
        </div>
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 bg-primary hover:bg-primary-hover text-background-dark font-semibold px-4 py-2 rounded-xl transition-colors shadow-lg shadow-primary/20 disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          {saving ? "Sauvegarde..." : "Enregistrer"}
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-[#2c241b] p-6 rounded-2xl border border-[#493622] shadow-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-[#493622] pb-4">
            <div className="p-2 bg-green-500/10 text-green-400 rounded-lg">
              <CreditCard className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">Finances & Frais</h2>
          </div>

          <div>
            <label className="block text-[#cbad90] text-sm font-medium mb-2">
              Frais de plateforme (Commission %)
            </label>
            <input
              type="number"
              name="platformFee"
              value={settings.platformFee}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-[#231a10] border border-[#493622] rounded-xl text-white focus:outline-none focus:border-primary transition-colors"
            />
            <p className="text-xs text-gray-500 mt-2">
              Pourcentage prélevé sur chaque réservation partenaire (affichage local).
            </p>
          </div>
        </div>

        <div className="bg-[#2c241b] p-6 rounded-2xl border border-[#493622] shadow-xl space-y-6">
          <div className="flex items-center gap-3 border-b border-[#493622] pb-4">
            <div className="p-2 bg-red-500/10 text-red-400 rounded-lg">
              <Shield className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">Sécurité & Accès</h2>
          </div>

          <div className="space-y-4">
            <label className="flex items-center justify-between cursor-pointer gap-4">
              <div>
                <p className="text-white font-medium">Mode Maintenance</p>
                <p className="text-xs text-gray-500">
                  Bloquer l&apos;accès à tous sauf les super admins. Persisté localement.
                </p>
                {maintenanceMode && (
                  <p className="text-xs text-orange-400 mt-1 font-semibold">
                    Actif — les utilisateurs voient l&apos;écran maintenance.
                  </p>
                )}
              </div>
              <input
                type="checkbox"
                checked={maintenanceMode}
                onChange={handleMaintenanceToggle}
                className="w-5 h-5 accent-primary bg-[#231a10] border-[#493622] rounded shrink-0"
              />
            </label>
            <hr className="border-[#493622]" />
            <label className="flex items-center justify-between cursor-pointer gap-4">
              <div>
                <p className="text-white font-medium">Nouvelles Inscriptions</p>
                <p className="text-xs text-gray-500">
                  Autoriser de nouveaux utilisateurs à s&apos;inscrire.
                </p>
              </div>
              <input
                type="checkbox"
                name="allowNewRegistrations"
                checked={settings.allowNewRegistrations}
                onChange={handleChange}
                className="w-5 h-5 accent-primary bg-[#231a10] border-[#493622] rounded shrink-0"
              />
            </label>
          </div>
        </div>

        <div className="bg-[#2c241b] p-6 rounded-2xl border border-[#493622] shadow-xl space-y-6 md:col-span-2">
          <div className="flex items-center gap-3 border-b border-[#493622] pb-4">
            <div className="p-2 bg-blue-500/10 text-blue-400 rounded-lg">
              <Globe className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold text-white">Général</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-[#cbad90] text-sm font-medium mb-2">
                Email de contact principal
              </label>
              <input
                type="email"
                name="contactEmail"
                value={settings.contactEmail}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-[#231a10] border border-[#493622] rounded-xl text-white focus:outline-none focus:border-primary transition-colors"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
