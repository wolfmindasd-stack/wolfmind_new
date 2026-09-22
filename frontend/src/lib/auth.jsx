// frontend/src/lib/auth.jsx
import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";

const AuthCtx = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  // Carica utente al caricamento dell'app
  useEffect(() => {
    (async () => {
      try {
        // Leggi profilo salvato
        const profilo = JSON.parse(localStorage.getItem("profilo"));

        if (!profilo || !profilo.id) {
          setUser(false);
          return;
        }

        // Chiamata corretta con ID
        const { data } = await api.get(`/api/auth/me?id=${profilo.id}`);
        setUser(data);
      } catch (err) {
        console.error("Errore /api/auth/me:", err);
        setUser(false);
      }
    })();
  }, []);

  // LOGIN
  const login = async (email, password) => {
    try {
      const { data } = await api.post("/api/auth/login", { email, password });

      // Salva il profilo completo
      localStorage.setItem("profilo", JSON.stringify(data));

      // Imposta utente
      setUser(data);

      return data;
    } catch (err) {
      console.error("Errore login:", err);
      throw err;
    }
  };

  // LOGOUT
  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch {}

    localStorage.removeItem("profilo");
    setUser(false);
  };

  return (
    <AuthCtx.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthCtx.Provider>
  );
}

export const useAuth = () => useContext(AuthCtx);
