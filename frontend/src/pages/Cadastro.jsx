import { useState } from "react";
import { Link } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import Button from "../components/Button";
import FormError from "../components/FormError";
import Input from "../components/Input";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../lib/api";
import {
  validateEmail,
  validateName,
  validatePassword,
} from "../lib/validation";

function Cadastro() {
  const { register } = useAuth();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [age, setAge] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  function validateForm() {
    const nextErrors = {
      name: validateName(name),
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setErrors(nextErrors);
    return !nextErrors.name && !nextErrors.email && !nextErrors.password;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (!validateForm()) return;

    setLoading(true);
    try {
      await register({
        name: name.trim(),
        email: email.trim(),
        password,
        age: age ? Number(age) : null,
      });
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Não foi possível cadastrar";
      setFormError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Criar conta" subtitle="Cadastre-se na Clínica Vitta">
      <form className="form" onSubmit={handleSubmit} noValidate>
        <Input
          id="name"
          label="Nome completo"
          type="text"
          autoComplete="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          error={errors.name}
          placeholder="Seu nome"
        />
        <Input
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          error={errors.email}
          placeholder="seu@email.com"
        />
        <Input
          id="password"
          label="Senha"
          type="password"
          autoComplete="new-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          placeholder="Mínimo 6 caracteres"
        />
        <Input
          id="age"
          label="Idade (opcional)"
          type="number"
          min="0"
          max="120"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          placeholder="Ex: 30"
        />

        <FormError message={formError} />

        <Button type="submit" loading={loading}>
          Cadastrar
        </Button>
      </form>

      <p className="auth-link">
        Já tem conta? <Link to="/">Fazer login</Link>
      </p>
    </AuthLayout>
  );
}

export default Cadastro;
