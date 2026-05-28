import { Link } from "react-router-dom";
import Button from "./Button";
import { useAuth } from "../hooks/useAuth";
import { getStoredUser } from "../lib/authStorage";

function PageLayout({ title, subtitle, children, wide = false }) {
  const { logout } = useAuth();
  const user = getStoredUser();
  const isAdmin = user?.role === "admin";

  return (
    <main className="page dashboard-page">
      <div className={`card ${wide ? "card-wide" : ""}`}>
        <header className="page-header">
          <div>
            <h1>{title}</h1>
            {subtitle ? <p className="subtitle">{subtitle}</p> : null}
          </div>
          <nav className="page-nav" aria-label="Navegação principal">
            <Link to="/dashboard" className="nav-link">
              Painel
            </Link>
            <Link to="/agendamento" className="nav-link">
              Agendamentos
            </Link>
            {isAdmin ? (
              <Link to="/admin" className="nav-link nav-link-admin">
                Admin
              </Link>
            ) : null}
          </nav>
        </header>
        {children}
      </div>
    </main>
  );
}

export default PageLayout;
