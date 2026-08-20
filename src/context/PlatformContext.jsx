import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { getPlatformSettings, updatePlatformSettings } from "../services/adminService";

const PlatformContext = createContext(null);

export function PlatformProvider({ children }) {
  const [maintenanceMode, setMaintenanceModeState] = useState(false);
  const [contactEmail, setContactEmail] = useState("contact@footbooking.com");
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  const fetchSettings = useCallback(async () => {
    try {
      const settings = await getPlatformSettings();
      setMaintenanceModeState(settings?.maintenance_mode ?? false);
      setContactEmail(settings?.contact_email || "contact@footbooking.com");
    } catch (err) {
      console.error("Erreur chargement paramètres plateforme:", err);
    } finally {
      setSettingsLoaded(true);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  const setMaintenanceMode = useCallback(async (enabled) => {
    setMaintenanceModeState(enabled);
    try {
      await updatePlatformSettings({ maintenance_mode: enabled });
    } catch (err) {
      console.error("Erreur sauvegarde maintenance:", err);
      setMaintenanceModeState(!enabled);
    }
  }, []);

  const value = useMemo(
    () => ({
      maintenanceMode,
      setMaintenanceMode,
      contactEmail,
      refreshPlatformConfig: fetchSettings,
      settingsLoaded,
    }),
    [maintenanceMode, setMaintenanceMode, contactEmail, fetchSettings, settingsLoaded],
  );

  return (
    <PlatformContext.Provider value={value}>{children}</PlatformContext.Provider>
  );
}

export function usePlatform() {
  const ctx = useContext(PlatformContext);
  if (!ctx) {
    throw new Error("usePlatform doit être utilisé dans PlatformProvider");
  }
  return ctx;
}
