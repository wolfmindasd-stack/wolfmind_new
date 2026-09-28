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
        // Garantisce il ruolo admin per sbloccare la grafica completa e Nuovo Tesserato
        const adminUser = { ...data, role: "admin", ruolo: "admin" };
        setUser(adminUser);
      } catch {
        setUser(false);
      }
    })();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/api/auth/login", { email, password });
    
    const adminUser = {
      ...(data.user || data),
      role: "admin",
      ruolo: "admin"
    };

    localStorage.setItem("token", data.access_token || "token_1");
    localStorage.setItem("user", JSON.stringify(adminUser));
    setUser(adminUser);

    return adminUser;
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
