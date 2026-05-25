import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import AuthLayout from "../components/AuthLayout";
import Button from "../components/Button";
import FormError from "../components/FormError";
import Input from "../components/Input";
import { useAuth } from "../hooks/useAuth";
import { ApiError } from "../lib/api";
import { validateEmail, validatePassword } from "../lib/validation";

function Login() {
  const { login } = useAuth();
  const location = useLocation();
  const successMessage = location.state?.message;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState({});
  const [formError, setFormError] = useState("");
  const [loading, setLoading] = useState(false);

  function validateForm() {
    const nextErrors = {
      email: validateEmail(email),
      password: validatePassword(password),
    };
    setErrors(nextErrors);
    return !nextErrors.email && !nextErrors.password;
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setFormError("");

    if (!validateForm()) return;

    setLoading(true);
    try {
      await login(email.trim(), password);
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Não foi possível fazer login";
      setFormError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthLayout title="Clínica Vitta" subtitle="Acesse sua conta">
      {successMessage ? (
        <p className="form-success" role="status">
          {successMessage}
        </p>
      ) : null}

      <form className="form" onSubmit={handleSubmit} noValidate>
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
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          error={errors.password}
          placeholder="Sua senha"
        />

        <FormError message={formError} />

        <Button type="submit" loading={loading}>
          Entrar
        </Button>
      </form>

      <p className="auth-link">
        Não tem conta? <Link to="/cadastro">Criar conta</Link>
      </p>
    </AuthLayout>
  );
}

export default Login;
