import { createContext, useContext, useEffect, useState } from "react";
import api from "../api/axios";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.get("/api/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  const register = async (username, email, password) => {
    const res = await api.post("/api/auth/register", { username, email, password });
    setUser(res.data);
  };

  const login = async (email, password) => {
    const res = await api.post("/api/auth/login", { email, password });
    setUser(res.data);
  };

  const logout = async () => {
    await api.post("/api/auth/logout");
    setUser(null);
  };

  const forgotPassword = async (email) => {
    await api.post("/api/auth/forgot-password", { email });
  };

  const resetPassword = async (resetToken, password) => {
    await api.post(`/api/auth/reset-password/${resetToken}`, { password });
  };

  return (
    <AuthContext.Provider value={{ user, loading, register, login, logout, forgotPassword, resetPassword }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}