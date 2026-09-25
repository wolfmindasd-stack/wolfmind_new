import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = loading, false = non loggato, object = loggato

  const loadUser = async () => {
    const token = localStorage.getItem("token");
    
    // Se non c'è token, l'utente non è autenticato
    if (!token) {
      setUser(false);
      return;
    }

    try {
      // Esegui la chiamata inviando il token di autenticazione
      const res = await api.get("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
    } catch (err) {
      console.warn("Errore durante il recupero dell'utente (422/401):", err.response?.status);
      
      // Se il token è illegale, scaduto o invalido (422 o 401), pulisci il localStorage
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      setUser(false);
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (email, password) => {
    // Adatta il payload in base alle esigenze del tuo backend.
    // Invia solo username e password
    const payload = { username: email, password: password };
    
    try {
      const res = await api.post("/api/auth/login", payload);
      const authData = res.data;

      // Estrai il token (supporta diversi formati di risposta backend)
      const token = authData.access_token || authData.token || authData.id;

      if (token) {
        localStorage.setItem("token", token);
      }
      
      localStorage.setItem("user", JSON.stringify(authData));
      setUser(authData);
      return authData;
    } catch (err) {
      console.error("Errore Login:", err.response?.data || err.message);
      throw err;
    }
  };

  const logout = async () => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await api.post("/api/auth/logout", {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
      }
    } catch (err) {
      console.warn("Logout error:", err);
    } finally {
      localStorage.removeItem("token");
      localStorage.removeItem("user");
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
