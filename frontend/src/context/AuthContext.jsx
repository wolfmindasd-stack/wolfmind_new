import { createContext, useEffect, useState } from "react";
import { api } from "../lib/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (!saved) {
      setLoading(false);
      return;
    }

    try {
      const u = JSON.parse(saved);
      const token = localStorage.getItem("token") || u.token || u.id;

      if (!u.id) {
        setLoading(false);
        return;
      }

      // Eseguiamo la chiamata corretta all'endpoint /api/auth/me
      api.get(`/api/auth/me?id=${u.id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
        .then((res) => {
          setUser(res.data);
        })
        .catch(() => {
          // Se la sessione scade o non è valida, ripuliamo lo storage
          localStorage.removeItem("user");
          localStorage.removeItem("token");
          setUser(null);
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (e) {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      setUser(null);
      setLoading(false);
    }
  }, []);

  // Evita il reflash iniziale schermando i componenti figli durante il controllo dell'utente
  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <p>Caricamento in corso...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
