import { STATUS_LABELS } from "../lib/constants";

function formatDate(date) {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

function AppointmentTable({ appointments, usersById = {}, onStatusChange, onDelete, busyId }) {
  if (!appointments.length) {
    return <p className="empty-state">Nenhuma consulta encontrada.</p>;
  }

  return (
    <div className="table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            <th>Paciente</th>
            <th>Tipo</th>
            <th>Data</th>
            <th>Hora</th>
            <th>Status</th>
            <th>Usuário</th>
            <th>Ações</th>
          </tr>
        </thead>
        <tbody>
          {appointments.map((item) => {
            const owner = usersById[item.userId];
            return (
              <tr key={item.id}>
                <td>{item.patientName}</td>
                <td>{item.appointmentType}</td>
                <td>{formatDate(item.date)}</td>
                <td>{item.time}</td>
                <td>
                  <select
                    value={item.status}
                    disabled={busyId === item.id}
                    onChange={(e) => onStatusChange(item, e.target.value)}
                    aria-label={`Status da consulta de ${item.patientName}`}
                  >
                    {Object.entries(STATUS_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))}
                  </select>
                </td>
                <td>{owner?.name || item.patientEmail || item.userId}</td>
                <td>
                  <button
                    type="button"
                    className="btn btn-danger btn-small"
                    disabled={busyId === item.id}
                    onClick={() => onDelete(item)}
                  >
                    Excluir
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

export default AppointmentTable;
