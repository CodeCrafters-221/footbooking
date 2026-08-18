import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  CONFIG_EVENTS,
  getMaintenanceMode,
  setMaintenanceMode as persistMaintenance,
} from "../utils/platformConfig";

const PlatformContext = createContext(null);

export function PlatformProvider({ children }) {
  const [maintenanceMode, setMaintenanceModeState] = useState(getMaintenanceMode);

  const syncFromStorage = useCallback(() => {
    setMaintenanceModeState(getMaintenanceMode());
  }, []);

  useEffect(() => {
    const onStorage = (e) => {
      if (e.key === null || e.key?.includes("footbooking")) syncFromStorage();
    };
    const onCustom = () => syncFromStorage();
    window.addEventListener("storage", onStorage);
    window.addEventListener(CONFIG_EVENTS.CHANGED, onCustom);
    return () => {
      window.removeEventListener("storage", onStorage);
      window.removeEventListener(CONFIG_EVENTS.CHANGED, onCustom);
    };
  }, [syncFromStorage]);

  const setMaintenanceMode = useCallback((enabled) => {
    persistMaintenance(enabled);
    setMaintenanceModeState(enabled);
  }, []);

  const value = useMemo(
    () => ({
      maintenanceMode,
      setMaintenanceMode,
      refreshPlatformConfig: syncFromStorage,
    }),
    [maintenanceMode, setMaintenanceMode, syncFromStorage],
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
