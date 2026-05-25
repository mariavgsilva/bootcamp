import { useNavigate } from "react-router-dom";
import { loginUser, registerUser } from "../lib/api";
import { clearAuth, getStoredUser, isAuthenticated, saveAuth } from "../lib/authStorage";

export function useAuth() {
  const navigate = useNavigate();
  const user = getStoredUser();

  async function login(email, password) {
    const data = await loginUser({ email, password });
    saveAuth(data.token, data.user);
    navigate("/dashboard", { replace: true });
  }

  async function register({ name, email, password, age }) {
    await registerUser({ name, email, password, age: age || null });
    navigate("/", {
      replace: true,
      state: { message: "Conta criada com sucesso. Faça login." },
    });
  }

  function logout() {
    clearAuth();
    navigate("/", { replace: true });
  }

  return {
    user,
    isAuthenticated: isAuthenticated(),
    login,
    register,
    logout,
  };
}
