import React, { useState, useEffect } from "react";
import { api } from "../lib/api";

export default function Profilo() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const [form, setForm] = useState({
    nome: "",
    cognome: "",
    email: "",
    telefono: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    old_password: "",
    new_password: "",
  });

  const [avatarFile, setAvatarFile] = useState(null);
  const [showAvatarModal, setShowAvatarModal] = useState(false);

  // -------------------------------
  // LOAD PROFILO
  // -------------------------------
  const load = async () => {
    const r = await api.get("/profilo/me");
    setData(r.data);

    setForm({
      nome: r.data.nome || "",
      cognome: r.data.cognome || "",
      email: r.data.email || "",
      telefono: r.data.telefono || "",
    });

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // -------------------------------
  // SALVA PROFILO
  // -------------------------------
  const save = async () => {
    await api.patch("/profilo/me", form);
    load();
  };

  // -------------------------------
  // CAMBIA PASSWORD
  // -------------------------------
  const changePassword = async () => {
    await api.patch("/profilo/password", passwordForm);
    setPasswordForm({ old_password: "", new_password: "" });
    alert("Password aggiornata");
  };

  // -------------------------------
  // CAMBIA AVATAR
  // -------------------------------
  const changeAvatar = async () => {
    if (!avatarFile) return;

    const fd = new FormData();
    fd.append("avatar", avatarFile);

    await api.patch("/profilo/avatar", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    setAvatarFile(null);
    setShowAvatarModal(false);
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
      <h1 className="text-2xl font-bold">Profilo</h1>

      {/* AVATAR */}
      <div className="flex items-center gap-4">
        <img
          src={data.avatar_url || "/default-avatar.png"}
          alt="Avatar"
          className="w-24 h-24 rounded-full border border-white/20 object-cover"
        />

        <button
          onClick={() => setShowAvatarModal(true)}
          className="px-4 py-2 bg-blue-600 rounded"
        >
          Cambia avatar
        </button>
      </div>

      {/* MODALE AVATAR */}
      {showAvatarModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white text-black p-6 rounded w-80 space-y-4">
            <h2 className="text-xl font-bold">Cambia avatar</h2>

            <input
              type="file"
              onChange={(e) => setAvatarFile(e.target.files[0])}
              className="text-sm"
            />

            <button
              onClick={changeAvatar}
              className="w-full bg-blue-600 text-white p-2 rounded"
            >
              Salva
            </button>

            <button
              onClick={() => setShowAvatarModal(false)}
              className="w-full bg-gray-300 p-2 rounded"
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      {/* DATI PROFILO */}
      <div className="bg-white/10 p-4 rounded-lg space-y-4">
        <input
          type="text"
          placeholder="Nome"
          className="border p-2 w-full rounded bg-white/20 text-white"
          value={form.nome}
          onChange={(e) => setForm({ ...form, nome: e.target.value })}
        />

        <input
          type="text"
          placeholder="Cognome"
          className="border p-2 w-full rounded bg-white/20 text-white"
          value={form.cognome}
          onChange={(e) => setForm({ ...form, cognome: e.target.value })}
        />

        <input
          type="email"
          placeholder="Email"
          className="border p-2 w-full rounded bg-white/20 text-white"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />

        <input
          type="text"
          placeholder="Telefono"
          className="border p-2 w-full rounded bg-white/20 text-white"
          value={form.telefono}
          onChange={(e) => setForm({ ...form, telefono: e.target.value })}
        />

        <button
          onClick={save}
          className="px-4 py-2 bg-blue-600 rounded w-full"
        >
          Salva profilo
        </button>
      </div>

      {/* PASSWORD */}
      <div className="bg-white/10 p-4 rounded-lg space-y-4">
        <h2 className="text-xl font-bold">Cambia password</h2>

        <input
          type="password"
          placeholder="Password attuale"
          className="border p-2 w-full rounded bg-white/20 text-white"
          value={passwordForm.old_password}
          onChange={(e) =>
            setPasswordForm({ ...passwordForm, old_password: e.target.value })
          }
        />

        <input
          type="password"
          placeholder="Nuova password"
          className="border p-2 w-full rounded bg-white/20 text-white"
          value={passwordForm.new_password}
          onChange={(e) =>
            setPasswordForm({ ...passwordForm, new_password: e.target.value })
          }
        />

        <button
          onClick={changePassword}
          className="px-4 py-2 bg-blue-600 rounded w-full"
        >
          Aggiorna password
        </button>
      </div>
    </div>
  );
}
