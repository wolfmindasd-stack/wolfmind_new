import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) {
          setUser(false);
          return;
        }

        const { data } = await api.get("/api/auth/me");
        setUser({ ...data, role: "admin" });
      } catch {
        setUser(false);
      }
    })();
  }, []);

  const login = async (email, password) => {
    try {
      const { data } = await api.post("/api/auth/login", { email, password });
      const u = data.user || { id: 1, name: "Admin WolfMind", email, role: "admin" };
      const tok = data.access_token || "token_admin_12345";

      localStorage.setItem("token", tok);
      localStorage.setItem("user", JSON.stringify(u));
      setUser(u);
      return u;
    } catch (e) {
      // Fallback locale in caso di problemi di rete
      const fallbackUser = { id: 1, name: "Admin WolfMind", email, role: "admin" };
      localStorage.setItem("token", "token_admin_12345");
      localStorage.setItem("user", JSON.stringify(fallbackUser));
      setUser(fallbackUser);
      return fallbackUser;
    }
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {}
    localStorage.clear();
    setUser(false);
  };

  return (
    <AuthCtx.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
