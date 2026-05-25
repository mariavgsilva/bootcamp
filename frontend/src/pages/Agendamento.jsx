import { useCallback, useEffect, useState } from "react";
import AppointmentCard from "../components/AppointmentCard";
import BookingSection from "../components/BookingSection";
import FormError from "../components/FormError";
import PageLayout from "../components/PageLayout";
import { ApiError } from "../lib/api";
import {
  createAppointment,
  deleteAppointment,
  fetchAppointments,
  updateAppointment,
} from "../lib/appointmentApi";
import { getStoredUser } from "../lib/authStorage";

function Agendamento() {
  const user = getStoredUser();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editing, setEditing] = useState(null);
  const [bookingKey, setBookingKey] = useState(0);

  const loadAppointments = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await fetchAppointments();
      setAppointments(data);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Erro ao carregar consultas",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAppointments();
  }, [loadAppointments]);

  async function handleCreate(payload) {
    setSaving(true);
    setSuccess("");
    try {
      if (editing) {
        await updateAppointment(editing.id, payload);
        setSuccess("Consulta atualizada com sucesso.");
        setEditing(null);
      } else {
        await createAppointment({
          ...payload,
          patientName: payload.patientName || user?.name,
        });
        setSuccess("Consulta agendada com sucesso.");
        setBookingKey((k) => k + 1);
      }
      await loadAppointments();
    } catch (err) {
      throw err instanceof ApiError
        ? err
        : new Error("Não foi possível salvar a consulta");
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel(appointment) {
    const confirmed = window.confirm(
      `Cancelar consulta de ${appointment.patientName} em ${appointment.date} às ${appointment.time}?`,
    );
    if (!confirmed) return;

    setBusyId(appointment.id);
    try {
      await updateAppointment(appointment.id, { status: "cancelled" });
      setSuccess("Consulta cancelada.");
      await loadAppointments();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Erro ao cancelar consulta",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(appointment) {
    const confirmed = window.confirm(
      "Deseja excluir esta consulta permanentemente?",
    );
    if (!confirmed) return;

    setBusyId(appointment.id);
    try {
      await deleteAppointment(appointment.id);
      setSuccess("Consulta excluída.");
      await loadAppointments();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Erro ao excluir consulta",
      );
    } finally {
      setBusyId(null);
    }
  }

  const scheduled = appointments.filter((a) => a.status === "scheduled");
  const history = appointments.filter((a) => a.status !== "scheduled");

  return (
    <PageLayout
      wide
      title="Agendamentos"
      subtitle="Agende consultas e acompanhe sua agenda na clínica"
    >
      {success ? (
        <p className="form-success" role="status">
          {success}
        </p>
      ) : null}
      <FormError message={error} />

      <BookingSection
        key={editing?.id || `new-${bookingKey}`}
        user={user}
        editing={editing}
        onSubmit={handleCreate}
        onCancelEdit={() => setEditing(null)}
        submitLabel={editing ? "Salvar alterações" : "Confirmar agendamento"}
        loading={saving}
      />

      <section className="section-block">
        <h2>Minhas consultas agendadas</h2>
        {loading ? (
          <p className="loading-text">Carregando...</p>
        ) : scheduled.length ? (
          <div className="appointment-list">
            {scheduled.map((item) => (
              <AppointmentCard
                key={item.id}
                appointment={item}
                busy={busyId === item.id}
                onEdit={setEditing}
                onCancel={handleCancel}
                onDelete={handleDelete}
              />
            ))}
          </div>
        ) : (
          <p className="empty-state">Você não tem consultas agendadas.</p>
        )}
      </section>

      {history.length ? (
        <section className="section-block">
          <h2>Histórico</h2>
          <div className="appointment-list">
            {history.map((item) => (
              <AppointmentCard
                key={item.id}
                appointment={item}
                onDelete={handleDelete}
                busy={busyId === item.id}
              />
            ))}
          </div>
        </section>
      ) : null}
    </PageLayout>
  );
}

export default Agendamento;
