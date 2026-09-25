import React, { useState } from "react";
import { api, formatApiErrorDetail } from "../lib/api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const login = async (e) => {
    if (e) e.preventDefault(); // Previene il submit di default del form
    setLoading(true);
    setError("");

    try {
      // Modificato il path aggiungendo /api per combaciare con la rotta del backend
      const res = await api.post("/api/auth/login", form);

      // Salva il profilo e il ruolo nel localStorage
      localStorage.setItem("user", JSON.stringify(res.data));
      if (res.data.ruolo) {
        localStorage.setItem("ruolo", res.data.ruolo);
      }

      navigate("/dashboard");
    } catch (err) {
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
