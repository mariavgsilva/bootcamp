import AppHeader from "./AppHeader";
import AppSidebar from "./AppSidebar";

/**
 * AppLayout — usado nas páginas autenticadas que precisam de header + sidebar.
 * Substitui PageLayout para /dashboard, /agendamento e /admin.
 *
 * Props:
 *   title      — título da página (exibido no topo do conteúdo)
 *   subtitle   — subtítulo opcional
 *   children   — conteúdo da página
 *   fullWidth  — remove max-width do conteúdo (ex: tabelas largas)
 */
function AppLayout({ title, subtitle, children, fullWidth = false }) {
  return (
    <div className="app-shell">
      <AppHeader />

      <div className="app-body">
        <AppSidebar />

        <main className="app-main" id="main-content">
          <div className={`app-content${fullWidth ? " app-content--full" : ""}`}>
            {(title || subtitle) && (
              <div className="app-page-header">
                {title && <h1 className="app-page-title">{title}</h1>}
                {subtitle && <p className="app-page-subtitle">{subtitle}</p>}
              </div>
            )}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}

export default AppLayout;
