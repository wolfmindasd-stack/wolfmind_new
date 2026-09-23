import React, { useState, useEffect } from "react";
import { api } from "../lib/api";

export default function Impostazioni() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const [form, setForm] = useState({
    nome_associazione: "",
    email: "",
    telefono: "",
    indirizzo: "",
    logo_url: "",
  });

  const [logoFile, setLogoFile] = useState(null);

  // -------------------------------
  // LOAD
  // -------------------------------
  const load = async () => {
    const r = await api.get("/impostazioni");
    setData(r.data);

    setForm({
      nome_associazione: r.data.nome_associazione || "",
      email: r.data.email || "",
      telefono: r.data.telefono || "",
      indirizzo: r.data.indirizzo || "",
      logo_url: r.data.logo_url || "",
    });

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // -------------------------------
  // SAVE
  // -------------------------------
  const save = async () => {
    await api.patch("/impostazioni", form);
    load();
  };

  // -------------------------------
  // CAMBIA LOGO
  // -------------------------------
  const changeLogo = async () => {
    if (!logoFile) return;

    const fd = new FormData();
    fd.append("logo", logoFile);

    await api.patch("/impostazioni/logo", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    setLogoFile(null);
    load();
  };

  if (loading) {
    return <div className="text-white">Caricamento…</div>;
  }

  // -------------------------------
  // RENDER
  // -------------------------------
  return (
    <div className="space-y-6 text-white">
      <h1 className="text-2xl font-bold">Impostazioni</h1>

      {/* LOGO */}
      <div className="flex items-center gap-4">
        <img
          src={data.logo_url || "/default-logo.png"}
          alt="Logo"
          className="w-24 h-24 object-cover rounded border border-white/20"
        />

        <div>
          <input
            type="file"
            onChange={(e) => setLogoFile(e.target.files[0])}
            className="text-sm"
          />
          <button
            onClick={changeLogo}
            className="px-3 py-1 bg-blue-600 rounded mt-2"
          >
            Cambia logo
          </button>
        </div>
      </div>

      {/* FORM */}
      <div className="bg-white/10 p-4 rounded-lg space-y-4">
        <input
          type="text"
          placeholder="Nome associazione"
          className="border p-2 w-full rounded bg-white/20 text-white"
          value={form.nome_associazione}
          onChange={(e) =>
            setForm({ ...form, nome_associazione: e.target.value })
          }
        />

        <input
          type="email"
          placeholder="Email"
          className="border p-2 w-full rounded bg-white/20 text-white"
          value={form.email}
          onChange={(e) =>
            setForm({ ...form, email: e.target.value })
          }
        />

        <input
          type="text"
          placeholder="Telefono"
          className="border p-2 w-full rounded bg-white/20 text-white"
          value={form.telefono}
          onChange={(e) =>
            setForm({ ...form, telefono: e.target.value })
          }
        />

        <input
          type="text"
          placeholder="Indirizzo"
          className="border p-2 w-full rounded bg-white/20 text-white"
          value={form.indirizzo}
          onChange={(e) =>
            setForm({ ...form, indirizzo: e.target.value })
          }
        />

        <button
          onClick={save}
          className="px-4 py-2 bg-blue-600 rounded w-full"
        >
          Salva impostazioni
        </button>
      </div>
    </div>
  );
}
