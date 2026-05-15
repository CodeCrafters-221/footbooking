import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function OwnerRedirect({ children }) {
    const { profile, profileLoading } = useAuth();

    if (profileLoading) {
        return null; // Ou un spinner
    }

    if (profile?.role === "super_admin") {
        return <Navigate to="/admin" replace />;
    }

    if (profile?.role === "owner") {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}
