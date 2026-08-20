import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { usePlatform } from "../context/PlatformContext";
import MaintenancePage from "../pages/Maintenance";

export default function OwnerRedirect({ children }) {
  const { profile, profileLoading } = useAuth();
  const { maintenanceMode } = usePlatform();

  if (profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary" />
      </div>
    );
  }

  if (profile?.is_active === false) {
    return <MaintenancePage blocked />;
  }

  if (maintenanceMode && profile?.role !== "super_admin") {
    return <MaintenancePage />;
  }

  if (profile?.role === "super_admin") {
    return <Navigate to="/admin" replace />;
  }

  if (profile?.role === "owner") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}
