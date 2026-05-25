import { useEffect, useMemo, useState } from "react";
import AppointmentForm from "./AppointmentForm";
import TimeSlotPicker from "./TimeSlotPicker";
import { ApiError } from "../lib/api";
import { fetchDaySchedule } from "../lib/appointmentApi";

function formatDisplayDate(dateStr) {
  if (!dateStr) return "";
  const [y, m, d] = dateStr.split("-");
  return `${d}/${m}/${y}`;
}

function BookingSection({
  user,
  editing,
  onSubmit,
  onCancelEdit,
  submitLabel,
  loading,
  onSuccessReset,
}) {
  const today = new Date().toISOString().slice(0, 10);

  const [scheduleDate, setScheduleDate] = useState(
    editing?.date || today,
  );
  const [selectedTime, setSelectedTime] = useState(editing?.time || "");
  const [slots, setSlots] = useState([]);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [scheduleError, setScheduleError] = useState("");

  useEffect(() => {
    if (editing) {
      setScheduleDate(editing.date);
      setSelectedTime(editing.time);
    }
  }, [editing]);

  useEffect(() => {
    if (!scheduleDate) {
      setSlots([]);
      return;
    }

    let cancelled = false;

    async function loadSchedule() {
      setScheduleLoading(true);
      setScheduleError("");
      try {
        const data = await fetchDaySchedule(scheduleDate);
        if (!cancelled) {
          setSlots(data.slots);
          const stillAvailable = data.slots.some(
            (s) => s.time === selectedTime && s.available,
          );
          if (selectedTime && !stillAvailable) {
            setSelectedTime("");
          }
        }
      } catch (err) {
        if (!cancelled) {
          setScheduleError(
            err instanceof ApiError
              ? err.message
              : "Erro ao carregar horários",
          );
        }
      } finally {
        if (!cancelled) setScheduleLoading(false);
      }
    }

    loadSchedule();
    return () => {
      cancelled = true;
    };
  }, [scheduleDate]);

  function handleDateChange(newDate) {
    setScheduleDate(newDate);
    if (!editing) setSelectedTime("");
  }

  const formInitialValues = useMemo(
    () =>
      editing
        ? {
            patientName: editing.patientName,
            appointmentType: editing.appointmentType,
            doctor: editing.doctor || "",
            notes: editing.notes || "",
          }
        : { patientName: user?.name || "" },
    [editing, user?.name],
  );

  async function handleFormSubmit(payload) {
    await onSubmit({
      ...payload,
      date: scheduleDate,
      time: selectedTime,
    });
    if (!editing) {
      setSelectedTime("");
      onSuccessReset?.();
    }
  }

  return (
    <section className="booking-section">
      <div className="booking-section-header">
        <h2>{editing ? "Editar consulta" : "Agendar nova consulta"}</h2>
        <p className="booking-section-desc">
          Selecione a data e o horário à esquerda e preencha os dados do
          paciente à direita.
        </p>
      </div>

      <div className="booking-layout">
        <aside className="booking-panel booking-panel--schedule">
          <div className="booking-panel-inner">
            <h3 className="booking-panel-title">Horários disponíveis</h3>

            <div className="form-field booking-date-field">
              <label htmlFor="bookingDate">Data da consulta</label>
              <input
                id="bookingDate"
                type="date"
                min={today}
                value={scheduleDate}
                onChange={(e) => handleDateChange(e.target.value)}
              />
            </div>

            {scheduleError ? (
              <p className="field-error" role="alert">
                {scheduleError}
              </p>
            ) : null}

            <TimeSlotPicker
              date={scheduleDate}
              slots={slots}
              selectedTime={selectedTime}
              onSelectTime={setSelectedTime}
              loading={scheduleLoading}
            />
          </div>
        </aside>

        <div className="booking-panel booking-panel--form">
          <div className="booking-panel-inner">
            <h3 className="booking-panel-title">Dados do paciente</h3>

            {scheduleDate && selectedTime ? (
              <div className="booking-selection-summary" role="status">
                <span className="booking-selection-label">Selecionado</span>
                <strong>
                  {formatDisplayDate(scheduleDate)} às {selectedTime}
                </strong>
              </div>
            ) : (
              <p className="booking-selection-hint">
                Selecione um horário disponível para continuar.
              </p>
            )}

            <AppointmentForm
              scheduleMode
              date={scheduleDate}
              time={selectedTime}
              initialValues={formInitialValues}
              onSubmit={handleFormSubmit}
              onCancel={editing ? onCancelEdit : undefined}
              submitLabel={submitLabel}
              loading={loading}
            />
          </div>
        </div>
      </div>
    </section>
  );
}

export default BookingSection;
