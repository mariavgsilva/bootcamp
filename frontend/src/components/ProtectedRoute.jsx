import { Navigate, useLocation } from "react-router-dom";
import { isAuthenticated } from "../lib/authStorage";

function ProtectedRoute({ children }) {
  const location = useLocation();

  if (!isAuthenticated()) {
    return <Navigate to="/" replace state={{ from: location.pathname }} />;
  }

  return children;
}

export default ProtectedRoute;
