import { useCallback, useEffect, useMemo, useState } from "react";
import AdminSidebar from "../components/AdminSidebar";
import AppointmentTable from "../components/AppointmentTable";
import FormError from "../components/FormError";
import AppLayout from "../components/AppLayout";
import ScheduleGrid from "../components/ScheduleGrid";
import SelectField from "../components/SelectField";
import { ApiError } from "../lib/api";
import {
  deleteAppointment,
  fetchAllUsers,
  fetchAppointmentStats,
  fetchAppointments,
  fetchDaySchedule,
  updateAppointment,
} from "../lib/appointmentApi";
import { APPOINTMENT_STATUSES, APPOINTMENT_TYPES, STATUS_LABELS } from "../lib/constants";

function AdminDashboard() {
  const [users, setUsers] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [stats, setStats] = useState(null);
  const [filters, setFilters] = useState({
    date: "",
    appointmentType: "",
    status: "",
    userId: "",
  });
  const [scheduleDate, setScheduleDate] = useState("");
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [scheduleLoading, setScheduleLoading] = useState(false);
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [usersData, appointmentsData, statsData] = await Promise.all([
        fetchAllUsers(),
        fetchAppointments(filters),
        fetchAppointmentStats(),
      ]);
      setUsers(usersData);
      setAppointments(appointmentsData);
      setStats(statsData);
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Erro ao carregar painel admin",
      );
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  useEffect(() => {
    if (!scheduleDate) {
      setSlots([]);
      return;
    }

    async function loadSchedule() {
      setScheduleLoading(true);
      try {
        const data = await fetchDaySchedule(scheduleDate);
        setSlots(data.slots);
      } catch (err) {
        setError(
          err instanceof ApiError ? err.message : "Erro ao carregar agenda",
        );
      } finally {
        setScheduleLoading(false);
      }
    }

    loadSchedule();
  }, [scheduleDate]);

  const usersById = useMemo(
    () =>
      users.reduce((acc, user) => {
        acc[user.id] = user;
        return acc;
      }, {}),
    [users],
  );

  async function handleStatusChange(appointment, status) {
    setBusyId(appointment.id);
    try {
      await updateAppointment(appointment.id, { status });
      await loadData();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Erro ao atualizar status",
      );
    } finally {
      setBusyId(null);
    }
  }

  async function handleDelete(appointment) {
    const confirmed = window.confirm(
      `Excluir consulta de ${appointment.patientName}?`,
    );
    if (!confirmed) return;

    setBusyId(appointment.id);
    try {
      await deleteAppointment(appointment.id);
      await loadData();
    } catch (err) {
      setError(
        err instanceof ApiError ? err.message : "Erro ao excluir consulta",
      );
    } finally {
      setBusyId(null);
    }
  }

  const typeOptions = APPOINTMENT_TYPES.map((t) => ({ value: t, label: t }));
  const statusOptions = APPOINTMENT_STATUSES.map((s) => ({
    value: s,
    label: STATUS_LABELS[s],
  }));
  const userOptions = users.map((u) => ({
    value: u.id,
    label: `${u.name} (${u.email})`,
  }));

  return (
    <AppLayout
      wide
      title="Painel administrativo"
      subtitle="Gerencie usuarios, consultas e ocupacao da clinica"
    >
      <FormError message={error} />

      <div className="admin-layout">
        <AdminSidebar stats={stats} />

        <div className="admin-main">
          <section className="section-block">
            <h2>Filtros</h2>
            <div className="filters-grid">
              <div className="form-field">
                <label htmlFor="filterDate">Data</label>
                <input
                  id="filterDate"
                  type="date"
                  value={filters.date}
                  onChange={(e) =>
                    setFilters((prev) => ({ ...prev, date: e.target.value }))
                  }
                />
              </div>
              <SelectField
                id="filterType"
                label="Tipo"
                value={filters.appointmentType}
                onChange={(e) =>
                  setFilters((prev) => ({
                    ...prev,
                    appointmentType: e.target.value,
                  }))
                }
                options={typeOptions}
                placeholder="Todos os tipos"
              />
              <SelectField
                id="filterStatus"
                label="Status"
                value={filters.status}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, status: e.target.value }))
                }
                options={statusOptions}
                placeholder="Todos os status"
              />
              <SelectField
                id="filterUser"
                label="Usuario"
                value={filters.userId}
                onChange={(e) =>
                  setFilters((prev) => ({ ...prev, userId: e.target.value }))
                }
                options={userOptions}
                placeholder="Todos os usuarios"
              />
            </div>
          </section>

          <section className="section-block">
            <h2>Agenda ocupada</h2>
            <div className="form-field">
              <label htmlFor="adminScheduleDate">Dia</label>
              <input
                id="adminScheduleDate"
                type="date"
                value={scheduleDate}
                onChange={(e) => setScheduleDate(e.target.value)}
              />
            </div>
            <ScheduleGrid
              date={scheduleDate}
              slots={slots}
              loading={scheduleLoading}
            />
          </section>

          <section className="section-block">
            <h2>Todas as consultas</h2>
            {loading ? (
              <p className="loading-text">Carregando consultas...</p>
            ) : (
              <AppointmentTable
                appointments={appointments}
                usersById={usersById}
                onStatusChange={handleStatusChange}
                onDelete={handleDelete}
                busyId={busyId}
              />
            )}
          </section>

          <section className="section-block">
            <h2>Usuarios</h2>
            {loading ? (
              <p className="loading-text">Carregando usuarios...</p>
            ) : (
              <div className="table-wrap">
                <table className="data-table">
                  <thead>
                    <tr>
                      <th>Nome</th>
                      <th>Email</th>
                      <th>Perfil</th>
                      <th>Cadastro</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id}>
                        <td>{user.name}</td>
                        <td>{user.email}</td>
                        <td>{user.role}</td>
                        <td>
                          {new Date(user.createdAt).toLocaleDateString("pt-BR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </div>
      </div>
    </AppLayout>
  );
}

export default AdminDashboard;
