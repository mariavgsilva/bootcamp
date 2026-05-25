import Button from "./Button";
import { STATUS_LABELS } from "../lib/constants";

function formatDate(date) {
  const [y, m, d] = date.split("-");
  return `${d}/${m}/${y}`;
}

function AppointmentCard({
  appointment,
  showOwner = false,
  onEdit,
  onCancel,
  onDelete,
  busy = false,
}) {
  const statusClass = `status-badge status-${appointment.status}`;

  return (
    <article className="appointment-card">
      <div className="appointment-card-header">
        <h3>{appointment.appointmentType}</h3>
        <span className={statusClass}>{STATUS_LABELS[appointment.status]}</span>
      </div>
      <p className="appointment-meta">
        <strong>{appointment.patientName}</strong>
      </p>
      <p className="appointment-meta">
        {formatDate(appointment.date)} às {appointment.time}
      </p>
      {appointment.doctor ? (
        <p className="appointment-meta">Médico: {appointment.doctor}</p>
      ) : null}
      {appointment.notes ? (
        <p className="appointment-notes">{appointment.notes}</p>
      ) : null}
      {showOwner && appointment.patientEmail ? (
        <p className="appointment-meta">Conta: {appointment.patientEmail}</p>
      ) : null}

      <div className="appointment-actions">
        {appointment.status === "scheduled" && onEdit ? (
          <Button type="button" variant="secondary" onClick={() => onEdit(appointment)} disabled={busy}>
            Editar
          </Button>
        ) : null}
        {appointment.status === "scheduled" && onCancel ? (
          <Button type="button" variant="secondary" onClick={() => onCancel(appointment)} disabled={busy}>
            Cancelar
          </Button>
        ) : null}
        {onDelete ? (
          <Button type="button" variant="danger" onClick={() => onDelete(appointment)} disabled={busy}>
            Excluir
          </Button>
        ) : null}
      </div>
    </article>
  );
}

export default AppointmentCard;
