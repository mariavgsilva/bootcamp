import { Link } from "react-router-dom";
import Button from "./Button";
import { useAuth } from "../hooks/useAuth";
import { getStoredUser } from "../lib/authStorage";

function getInitials(name = "") {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((n) => n[0].toUpperCase())
    .join("");
}

function AppHeader() {
  const { logout } = useAuth();
  const user = getStoredUser();

  return (
    <header className="app-header">
      <div className="app-header-brand">
        <div className="brand-logo" aria-hidden="true">V</div>
        <div>
          <span className="brand-name">Vitta</span>
          <span className="brand-tagline">Clínica &amp; Saúde</span>
        </div>
      </div>

      <div className="app-header-right">
        {user && (
          <div className="header-user">
            <div className="header-user-info">
              <span className="header-user-name">{user.name}</span>
              <span className="header-user-role">
                {user.role === "admin" ? "Administrador" : "Paciente"}
              </span>
            </div>
            <div className="header-avatar" aria-hidden="true">
              {getInitials(user.name)}
            </div>
          </div>
        )}      
         <Button type="button" variant="secondary" onClick={logout} className="botaosair">
          desconectar
        </Button>
      </div>
    </header>
  );
}

export default AppHeader;
