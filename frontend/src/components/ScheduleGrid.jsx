function ScheduleGrid({ slots, loading, date }) {
  if (loading) {
    return <p className="loading-text">Carregando horários...</p>;
  }

  if (!date) {
    return <p className="empty-state">Selecione uma data para ver a agenda.</p>;
  }

  if (!slots?.length) {
    return <p className="empty-state">Nenhum horário disponível.</p>;
  }

  return (
    <div className="schedule-grid" role="table" aria-label={`Agenda do dia ${date}`}>
      <div className="schedule-grid-header" role="row">
        <span role="columnheader">Horário</span>
        <span role="columnheader">Status</span>
        <span role="columnheader">Detalhes</span>
      </div>
      {slots.map((slot) => (
        <div
          key={slot.time}
          className={`schedule-row ${slot.available ? "slot-available" : "slot-occupied"}`}
          role="row"
        >
          <span role="cell">{slot.time}</span>
          <span role="cell">{slot.available ? "Disponível" : "Ocupado"}</span>
          <span role="cell">
            {slot.appointment
              ? `${slot.appointment.appointmentType} - ${slot.appointment.patientName}`
              : "-"}
          </span>
        </div>
      ))}
    </div>
  );
}

export default ScheduleGrid;
