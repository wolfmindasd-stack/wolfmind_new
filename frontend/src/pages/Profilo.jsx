import React, { useState, useEffect } from "react";
import { api } from "../lib/api";

export default function Profilo() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const [showEdit, setShowEdit] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefono: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    attuale: "",
    nuova: "",
    conferma: "",
  });

  const [avatarFile, setAvatarFile] = useState(null);

  // -------------------------------
  // LOAD PROFILO
  // -------------------------------
  const load = async () => {
    const res = await api.get("/profilo");
    setData(res.data);

    setForm({
      nome: res.data.nome || "",
      email: res.data.email || "",
      telefono: res.data.telefono || "",
    });

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // -------------------------------
  // SALVA DATI PROFILO
  // -------------------------------
  const save = async () => {
    await api.patch("/profilo", form);
    setShowEdit(false);
    load();
  };

  // -------------------------------
  // CAMBIA PASSWORD
  // -------------------------------
  const changePassword = async () => {
    if (passwordForm.nuova !== passwordForm.conferma) {
      alert("Le password non coincidono");
      return;
    }

    await api.patch("/profilo/password", {
      attuale: passwordForm.attuale,
      nuova: passwordForm.nuova,
    });

    setPasswordForm({ attuale: "", nuova: "", conferma: "" });
    setShowPassword(false);
  };

  // -------------------------------
  // CAMBIA AVATAR
  // -------------------------------
  const changeAvatar = async () => {
    const fd = new FormData();
    fd.append("avatar", avatarFile);

    await api.patch("/profilo/avatar", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    setAvatarFile(null);
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
          className="w-20 h-20 rounded-full object-cover border border-white/20"
        />

        <div>
          <input
            type="file"
            onChange={(e) => setAvatarFile(e.target.files[0])}
            className="text-sm"
          />
          <button
            onClick={changeAvatar}
            className="px-3 py-1 bg-blue-600 rounded mt-2"
          >
            Cambia avatar
          </button>
        </div>
      </div>

      {/* INFO */}
      <div className="space-y-1">
        <div><strong>Nome:</strong> {data.nome}</div>
        <div><strong>Email:</strong> {data.email}</div>
        <div><strong>Telefono:</strong> {data.telefono}</div>
        <div><strong>Ruolo:</strong> {data.ruolo}</div>
      </div>

      {/* MODIFICA PROFILO */}
      <button
        onClick={() => setShowEdit(true)}
        className="px-4 py-2 bg-blue-600 rounded"
      >
        Modifica profilo
      </button>

      {showEdit && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white text-black p-6 rounded w-80 space-y-4">
            <h2 className="text-xl font-bold">Modifica profilo</h2>

            <input
              type="text"
              placeholder="Nome"
              className="border p-2 w-full rounded"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />

            <input
              type="email"
              placeholder="Email"
              className="border p-2 w-full rounded"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />

            <input
              type="text"
              placeholder="Telefono"
              className="border p-2 w-full rounded"
              value={form.telefono}
              onChange={(e) => setForm({ ...form, telefono: e.target.value })}
            />

            <button
              onClick={save}
              className="w-full bg-blue-600 text-white p-2 rounded"
            >
              Salva
            </button>

            <button
              onClick={() => setShowEdit(false)}
              className="w-full bg-gray-300 p-2 rounded"
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      {/* CAMBIO PASSWORD */}
      <button
        onClick={() => setShowPassword(true)}
        className="px-4 py-2 bg-blue-600 rounded"
      >
        Cambia password
      </button>

      {showPassword && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white text-black p-6 rounded w-80 space-y-4">
            <h2 className="text-xl font-bold">Cambia password</h2>

            <input
              type="password"
              placeholder="Password attuale"
              className="border p-2 w-full rounded"
              value={passwordForm.attuale}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, attuale: e.target.value })
              }
            />

            <input
              type="password"
              placeholder="Nuova password"
              className="border p-2 w-full rounded"
              value={passwordForm.nuova}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, nuova: e.target.value })
              }
            />

            <input
              type="password"
              placeholder="Conferma nuova password"
              className="border p-2 w-full rounded"
              value={passwordForm.conferma}
              onChange={(e) =>
                setPasswordForm({ ...passwordForm, conferma: e.target.value })
              }
            />

            <button
              onClick={changePassword}
              className="w-full bg-blue-600 text-white p-2 rounded"
            >
              Salva
            </button>

            <button
              onClick={() => setShowPassword(false)}
              className="w-full bg-gray-300 p-2 rounded"
            >
              Annulla
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
