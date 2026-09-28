import React, { useState } from "react";
import { api, formatApiErrorDetail } from "../lib/api";

export default function Login() {
  const [form, setForm] = useState({
    email: "admin@wolfmind.com",
    password: "WolfMind2026!",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async (e) => {
    if (e) e.preventDefault();
    setLoading(true);
    setError("");

    try {
      // Invio preciso delle chiavi email e password
      const payload = {
        email: form.email.trim(),
        password: form.password.trim(),
      };

      const res = await api.post("/api/auth/login", payload);

      const userData = {
        ...res.data,
        ruolo: "admin",
      };

      // Salvataggio nel localStorage
      localStorage.setItem("user", JSON.stringify(userData));
      localStorage.setItem("token", res.data.id || res.data.access_token || "1");
      localStorage.setItem("ruolo", "admin");

      // Reindirizzamento forzato alla home/dashboard
      window.location.href = "/";
    } catch (err) {
      console.error("Errore Login:", err.response?.data);
      setError(formatApiErrorDetail(err) || "Credenziali non valide");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <form onSubmit={login} className="bg-white p-8 rounded-lg w-80 space-y-4">
        <h1 className="text-2xl font-bold text-center text-gray-900">Login</h1>

        {error && (
          <div className="text-red-600 text-center text-sm font-medium">
            {error}
          </div>
        )}

        <input
          type="email"
          placeholder="Email"
          required
          className="border border-gray-300 p-2 w-full rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          type="password"
          placeholder="Password"
          required
          className="border border-gray-300 p-2 w-full rounded text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-600 hover:bg-blue-500 text-white p-2 rounded transition font-medium disabled:opacity-50"
        >
          {loading ? "Attendere..." : "Accedi"}
        </button>
      </form>
    </div>
  );
}
