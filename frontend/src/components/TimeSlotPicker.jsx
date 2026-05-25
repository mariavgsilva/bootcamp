function TimeSlotPicker({
  slots,
  selectedTime,
  onSelectTime,
  loading,
  date,
}) {
  if (!date) {
    return (
      <p className="time-slot-empty">
        Escolha uma data para ver os horários disponíveis.
      </p>
    );
  }

  if (loading) {
    return (
      <div className="time-slot-loading" aria-live="polite">
        <span className="time-slot-spinner" aria-hidden="true" />
        Carregando horários...
      </div>
    );
  }

  if (!slots?.length) {
    return (
      <p className="time-slot-empty">Nenhum horário disponível para este dia.</p>
    );
  }

  const availableCount = slots.filter((s) => s.available).length;

  return (
    <div className="time-slot-picker">
      <p className="time-slot-legend">
        <span className="legend-dot legend-available" />
        Disponível ({availableCount})
        <span className="legend-dot legend-occupied" />
        Ocupado
      </p>
      <div
        className="time-slot-grid"
        role="listbox"
        aria-label="Horários disponíveis"
      >
        {slots.map((slot) => {
          const isSelected = selectedTime === slot.time;
          const isDisabled = !slot.available;

          return (
            <button
              key={slot.time}
              type="button"
              role="option"
              aria-selected={isSelected}
              aria-disabled={isDisabled}
              disabled={isDisabled}
              title={
                isDisabled
                  ? slot.appointment
                    ? `${slot.appointment.appointmentType} — ocupado`
                    : "Horário indisponível"
                  : `Selecionar ${slot.time}`
              }
              className={[
                "time-slot-card",
                isSelected ? "time-slot-card--selected" : "",
                isDisabled ? "time-slot-card--disabled" : "",
              ]
                .filter(Boolean)
                .join(" ")}
              onClick={() => onSelectTime(slot.time)}
            >
              <span className="time-slot-time">{slot.time}</span>
              <span className="time-slot-status">
                {isDisabled ? "Ocupado" : isSelected ? "Selecionado" : "Livre"}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default TimeSlotPicker;
