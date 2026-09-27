import { createContext, useEffect, useState, useContext } from "react";
import { api } from "../lib/api";

export const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Caricamento iniziale dell'utente salvato
  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (!saved) {
      setLoading(false);
      return;
    }

    try {
      const u = JSON.parse(saved);
      if (!u || !u.id) {
        setLoading(false);
        return;
      }

      api.get(`/api/auth/me?id=${u.id}`)
        .then((res) => {
          setUser(res.data);
        })
        .catch(() => {
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

  // Funzione Login sincronizzata con lo stato di React
  const login = async (email, password) => {
    const res = await api.post("/api/auth/login", { email, password });
    const userData = res.data;

    const token = userData.access_token || userData.token || userData.id;
    if (token) {
      localStorage.setItem("token", token);
    }

    localStorage.setItem("user", JSON.stringify(userData));
    setUser(userData); // Aggiorna immediatamente lo stato dell'app
    return userData;
  };

  // Funzione Logout sincronizzata
  const logout = async () => {
    try {
      await api.post("/api/auth/logout");
    } catch (e) {
      console.warn("Logout error:", e);
    } finally {
      localStorage.removeItem("user");
      localStorage.removeItem("token");
      setUser(null); // Resetta lo stato di React rendendo immediato l'uscita
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100vh" }}>
        <p>Caricamento in corso...</p>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, setUser, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
