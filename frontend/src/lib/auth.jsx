import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = loading, false = non loggato, object = loggato

  const loadUser = async () => {
    try {
      const res = await api.get("/api/auth/me");
      setUser(res.data);
    } catch (err) {
      // Se fallisce il recupero dell'utente loggato, prova senza /api per fallback
      try {
        const resFallback = await api.get("/auth/me");
        setUser(resFallback.data);
      } catch (e) {
        setUser(false);
      }
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (email, password) => {
    // Tenta la chiamata alla rotta corretta POST /api/auth/login
    const payload = { username: email, email: email, password: password };
    
    try {
      const res = await api.post("/api/auth/login", payload);
      setUser(res.data);
      return res.data;
    } catch (err) {
      // Se per qualsiasi ragione fallisce /api/auth/login, fa il fallback su /auth/login
      if (err.response?.status === 404) {
        const resFallback = await api.post("/auth/login", payload);
        setUser(resFallback.data);
        return resFallback.data;
      }
      throw err;
    }
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      setUser(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, refreshUser: loadUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
