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

        const { data } = await api.get("/auth/me");
        setUser({ ...data, role: "admin", ruolo: "admin" });
      } catch {
        setUser(false);
      }
    })();
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post("/auth/login", { email, password });

    const adminUser = {
      ...(data.user || data),
      role: "admin",
      ruolo: "admin",
    };

    localStorage.setItem("token", data.access_token || "1");
    localStorage.setItem("user", JSON.stringify(adminUser));
    setUser(adminUser);

    return adminUser;
  };

  const logout = async () => {
    try {
      await api.post("/auth/logout");
    } catch {}

    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setUser(false);
  };

  return (
    <AuthCtx.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
