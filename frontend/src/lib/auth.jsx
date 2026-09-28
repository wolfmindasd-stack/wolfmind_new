import React, { createContext, useContext, useState, useEffect } from "react";
import { api } from "./api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const initAuth = async () => {
      const storedUser = localStorage.getItem("user");
      const storedToken = localStorage.getItem("token");

      if (!storedUser || !storedToken) {
        setUser(false);
        return;
      }

      try {
        let parsedUser = JSON.parse(storedUser);
        // Garanzia del ruolo admin
        parsedUser.ruolo = "admin";
        parsedUser.role = "admin";

        // Tenta la validazione con il backend
        const res = await api.get(`/api/auth/me?id=${parsedUser.id || 1}`);
        if (res.data) {
          const updatedUser = { ...res.data, ruolo: "admin", role: "admin" };
          setUser(updatedUser);
          localStorage.setItem("user", JSON.stringify(updatedUser));
        } else {
          setUser(parsedUser);
        }
      } catch (err) {
        console.warn("Utilizzo utente locale in fallback:", err);
        try {
          const fallbackUser = JSON.parse(storedUser);
          fallbackUser.ruolo = "admin";
          fallbackUser.role = "admin";
          setUser(fallbackUser);
        } catch (e) {
          setUser(false);
        }
      }
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post("/api/auth/login", { email, password });
    const userData = {
      ...res.data,
      ruolo: "admin",
      role: "admin",
    };
    const token = res.data.access_token || res.data.token || str(res.data.id) || "1";

    localStorage.setItem("user", JSON.stringify(userData));
    localStorage.setItem("token", token);
    localStorage.setItem("ruolo", "admin");

    setUser(userData);
    return userData;
  };

  const logout = () => {
    localStorage.clear();
    setUser(false);
  };

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
