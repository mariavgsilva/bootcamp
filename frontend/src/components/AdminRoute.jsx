import { Navigate } from "react-router-dom";
import { getStoredUser, isAuthenticated } from "../lib/authStorage";

function AdminRoute({ children }) {
  if (!isAuthenticated()) {
    return <Navigate to="/" replace />;
  }

  const user = getStoredUser();
  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

export default AdminRoute;
