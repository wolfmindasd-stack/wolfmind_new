import React, { useState } from "react";
import { api } from "../lib/api";
import { useNavigate } from "react-router-dom";

export default function Login() {
  const navigate = useNavigate();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // -------------------------------
  // LOGIN
  // -------------------------------
  const login = async () => {
    setLoading(true);
    setError("");

    try {
      const res = await api.post("/auth/login", form);

      // Salva token
      localStorage.setItem("token", res.data.token);

      // Vai alla dashboard
      navigate("/dashboard");
    } catch (err) {
      setError("Credenziali non valide");
    }

    setLoading(false);
  };

  // -------------------------------
  // RENDER
  // -------------------------------
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="bg-white p-8 rounded-lg w-80 space-y-4">
        <h1 className="text-2xl font-bold text-center">Login</h1>

        {error && (
          <div className="text-red-600 text-center text-sm">{error}</div>
        )}

        <input
          type="email"
          placeholder="Email"
          className="border p-2 w-full rounded"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          type="password"
          placeholder="Password"
          className="border p-2 w-full rounded"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />

        <button
          onClick={login}
          disabled={loading}
          className="w-full bg-blue-600 text-white p-2 rounded"
        >
          {loading ? "Attendere..." : "Accedi"}
        </button>
      </div>
    </div>
  );
}
