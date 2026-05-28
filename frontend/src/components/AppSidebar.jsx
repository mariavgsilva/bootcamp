import { NavLink } from "react-router-dom";
import { getStoredUser } from "../lib/authStorage";

const navMain = [
  {
    to: "/dashboard",
    label: "Painel",
  },
  {
    to: "/agendamento",
    label: "Agendamentos",
  },
];

const navAdmin = [
  {
    to: "/admin",
    label: "Gerenciar Consultas",
    adminOnly: true,
  },
];

function AppSidebar() {
  const user = getStoredUser();
  const isAdmin = user?.role === "admin";

  return (
    <aside className="app-sidebar" aria-label="Menu de navegação">
      <nav className="sidebar-nav">
        <p className="sidebar-section-label">Principal</p>
        {navMain.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `sidebar-nav-item${isActive ? " sidebar-nav-item--active" : ""}`
            }
          >
            {item.icon}
            {item.label}
          </NavLink>
        ))}

        {isAdmin && (
          <>
            <p className="sidebar-section-label" style={{ marginTop: "20px" }}>
              Administração
            </p>
            {navAdmin.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) =>
                  `sidebar-nav-item sidebar-nav-item--admin${isActive ? " sidebar-nav-item--active-admin" : ""}`
                }
              >
                {item.icon}
                {item.label}
              </NavLink>
            ))}
          </>
        )}
      </nav>
    </aside>
  );
}

export default AppSidebar;
