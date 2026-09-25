import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); // null = loading, false = non loggato, object = loggato

  const loadUser = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setUser(false);
      return;
    }

    try {
      // Impostiamo l'header Authorization per le chiamate successive
      const res = await api.get("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUser(res.data);
    } catch (err) {
      try {
        const resFallback = await api.get("/auth/me", {
          headers: { Authorization: `Bearer ${token}` }
        });
        setUser(resFallback.data);
      } catch (e) {
        localStorage.removeItem("token");
        setUser(false);
      }
    }
  };

  useEffect(() => {
    loadUser();
  }, []);

  const login = async (email, password) => {
    const payload = { username: email, email: email, password: password };
    
    // Tenta il login
    let authData;
    try {
      const res = await api.post("/api/auth/login", payload);
      authData = res.data;
    } catch (err) {
      if (err.response?.status === 404) {
        const resFallback = await api.post("/auth/login", payload);
        authData = resFallback.data;
      } else {
        throw err;
      }
    }

    // Salva il token se presente o salva l'oggetto utente
    const token = authData.access_token || authData.token || authData.id;
    if (token) {
      localStorage.setItem("token", token);
    }
    
    localStorage.setItem("user", JSON.stringify(authData));
    setUser(authData);
    return authData;
  };

  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
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
