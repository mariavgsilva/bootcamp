import { useEffect, useState } from "react";
import Button from "./Button";
import FormError from "./FormError";
import Input from "./Input";
import SelectField from "./SelectField";
import { APPOINTMENT_TYPES } from "../lib/constants";

const emptyForm = {
  patientName: "",
  appointmentType: "",
  date: "",
  time: "",
  doctor: "",
  notes: "",
};

function AppointmentForm({
  initialValues,
  onSubmit,
  onCancel,
  submitLabel = "Agendar consulta",
  loading = false,
  scheduleMode = false,
  date = "",
  time = "",
}) {
  const [form, setForm] = useState({ ...emptyForm, ...initialValues });
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");

  useEffect(() => {
    setForm({ ...emptyForm, ...initialValues });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues?.patientName, initialValues?.appointmentType]);

  function updateField(field, value) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function validate() {
    const next = {};
    if (!form.patientName.trim()) {
      next.patientName = "Informe o nome do paciente";
    }
    if (!form.appointmentType) {
      next.appointmentType = "Selecione o tipo";
    }
    if (scheduleMode) {
      if (!date) next.date = "Selecione a data";
      if (!time) next.time = "Selecione um horário";
    } else {
      if (!form.date) next.date = "Informe a data";
      if (!form.time) next.time = "Informe o horário";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");
    if (!validate()) return;

    try {
      await onSubmit({
        patientName: form.patientName.trim(),
        appointmentType: form.appointmentType,
        date: scheduleMode ? date : form.date,
        time: scheduleMode ? time : form.time,
        doctor: form.doctor.trim() || null,
        notes: form.notes.trim() || null,
      });
      if (!initialValues?.patientName) {
        setForm({ ...emptyForm, patientName: form.patientName });
      }
    } catch (err) {
      setFormError(err.message || "Erro ao salvar consulta");
    }
  }

  const typeOptions = APPOINTMENT_TYPES.map((type) => ({
    value: type,
    label: type,
  }));

  const today = new Date().toISOString().slice(0, 10);

  return (
    <form className="form booking-form" onSubmit={handleSubmit} noValidate>
      <Input
        id="patientName"
        label="Nome do paciente"
        value={form.patientName}
        onChange={(e) => updateField("patientName", e.target.value)}
        error={errors.patientName}
        placeholder="Nome completo"
      />
      <SelectField
        id="appointmentType"
        label="Tipo de consulta"
        value={form.appointmentType}
        onChange={(e) => updateField("appointmentType", e.target.value)}
        error={errors.appointmentType}
        options={typeOptions}
      />

      {!scheduleMode ? (
        <div className="form-row">
          <Input
            id="date"
            label="Data"
            type="date"
            min={today}
            value={form.date}
            onChange={(e) => updateField("date", e.target.value)}
            error={errors.date}
          />
          <Input
            id="time"
            label="Horário"
            type="time"
            value={form.time}
            onChange={(e) => updateField("time", e.target.value)}
            error={errors.time}
          />
        </div>
      ) : errors.date || errors.time ? (
        <p className="field-error" role="alert">
          {errors.date || errors.time}
        </p>
      ) : null}

      <Input
        id="doctor"
        label="Médico (opcional)"
        value={form.doctor}
        onChange={(e) => updateField("doctor", e.target.value)}
        placeholder="Dr(a). Nome"
      />
      <div className="form-field">
        <label htmlFor="notes">Observações (opcional)</label>
        <textarea
          id="notes"
          rows={3}
          value={form.notes}
          onChange={(e) => updateField("notes", e.target.value)}
          placeholder="Informações adicionais"
        />
      </div>

      <FormError message={formError} />

      <div className="form-actions">
        <Button
          type="submit"
          loading={loading}
          disabled={scheduleMode && (!date || !time)}
        >
          {submitLabel}
        </Button>
        {onCancel ? (
          <Button type="button" variant="secondary" onClick={onCancel}>
            Cancelar edição
          </Button>
        ) : null}
      </div>
    </form>
  );
}

export default AppointmentForm;
