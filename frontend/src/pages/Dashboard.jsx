import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import AppointmentCard from "../components/AppointmentCard";
import FormError from "../components/FormError";
import PageLayout from "../components/PageLayout";
import { useAuth } from "../hooks/useAuth";
import { ApiError, fetchProfile } from "../lib/api";
import { fetchAppointments } from "../lib/appointmentApi";
import { getStoredUser } from "../lib/authStorage";

function Dashboard() {
  const { user } = useAuth();
  const storedUser = getStoredUser();
  const isAdmin = storedUser?.role === "admin";

  const [profile, setProfile] = useState(user);
  const [upcoming, setUpcoming] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        const [profileData, appointments] = await Promise.all([
          fetchProfile(),
          fetchAppointments({ status: "scheduled" }),
        ]);
        setProfile(profileData);
        setUpcoming(appointments.slice(0, 3));
      } catch (err) {
        setError(
          err instanceof ApiError
            ? err.message
            : "Nao foi possivel carregar o painel",
        );
      } finally {
        setLoading(false);
      }
    }

    load();
  }, []);

  return (
    <PageLayout
      wide
      title="Painel da Clinica"
      subtitle={`Bem-vindo(a), ${profile?.name || "usuario"}`}
    >
      <FormError message={error} />

      <section className="section-block dashboard-summary">
        <h2>Proximas consultas</h2>
        {loading ? (
          <p className="loading-text">Carregando...</p>
        ) : upcoming.length ? (
          <div className="appointment-list compact">
            {upcoming.map((item) => (
              <AppointmentCard key={item.id} appointment={item} />
            ))}
          </div>
        ) : (
          <p className="empty-state">
            Nenhuma consulta agendada.{" "}
            <Link to="/agendamento">Agendar agora</Link>
          </p>
        )}
      </section>

      <div className="dashboard-actions">
        <Link to="/agendamento" className="btn btn-primary btn-link">
          Agendar consulta
        </Link>
        <Link to="/agendamento" className="btn btn-secondary btn-link">
          Ver todas as consultas
        </Link>
        {isAdmin ? (
          <Link to="/admin" className="btn btn-secondary btn-link">
            Painel admin
          </Link>
        ) : null}
      </div>
    </PageLayout>
  );
}

export default Dashboard;
