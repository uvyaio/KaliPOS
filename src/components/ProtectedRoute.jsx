import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

// Wrap any route element in this to require a signed-in owner OR staff
// session. If nobody's signed in, we bounce back to the home/login screen.
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="material-symbols-outlined text-primary text-[40px] animate-spin">progress_activity</span>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}
