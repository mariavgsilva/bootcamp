function AdminSidebar({ stats }) {
  if (!stats) {
    return <aside className="admin-sidebar">Carregando estatisticas...</aside>;
  }

  return (
    <aside className="admin-sidebar" aria-label="Resumo administrativo">
      <h2>Resumo</h2>
      <ul className="stats-list">
        <li>
          <span>Total de consultas</span>
          <strong>{stats.totalAppointments}</strong>
        </li>
        <li>
          <span>Usuarios cadastrados</span>
          <strong>{stats.totalUsers}</strong>
        </li>
        <li>
          <span>Agendadas</span>
          <strong>{stats.byStatus?.scheduled ?? 0}</strong>
        </li>
        <li>
          <span>Canceladas</span>
          <strong>{stats.byStatus?.cancelled ?? 0}</strong>
        </li>
        <li>
          <span>Concluidas</span>
          <strong>{stats.byStatus?.completed ?? 0}</strong>
        </li>
      </ul>
      <h3>Dias com agenda ocupada</h3>
      {stats.occupiedDays?.length ? (
        <ul className="occupied-days">
          {stats.occupiedDays.map((day) => (
            <li key={day}>{day}</li>
          ))}
        </ul>
      ) : (
        <p className="empty-state">Nenhum dia ocupado.</p>
      )}
    </aside>
  );
}

export default AdminSidebar;
