import { useAuth } from "../context/AuthContext";
import { usePlatform } from "../context/PlatformContext";
import { Navigate } from "react-router";
import MaintenancePage from "../pages/Maintenance";

export default function ProtectedRoute({ children, allowedRoles }) {
  const { user, profile, loading, profileLoading } = useAuth();
  const { maintenanceMode } = usePlatform();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (!user) return <Navigate to="/login" />;

  if (allowedRoles && profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background-dark">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-primary"></div>
      </div>
    );
  }

  if (profile?.is_active === false) {
    return <MaintenancePage blocked />;
  }

  const isSuperAdmin = profile?.role === "super_admin";

  if (
    maintenanceMode &&
    !isSuperAdmin &&
    !(allowedRoles?.length === 1 && allowedRoles[0] === "super_admin")
  ) {
    return <MaintenancePage />;
  }

  if (allowedRoles) {
    if (!profile || !allowedRoles.includes(profile.role)) {
      return <Navigate to="/" />;
    }
  }

  return children;
}
