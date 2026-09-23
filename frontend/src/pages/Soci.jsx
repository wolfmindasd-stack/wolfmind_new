import React, { useState, useEffect } from "react";
import { api } from "../lib/api";

export default function Soci() {
  const [soci, setSoci] = useState([]);
  const [quote, setQuote] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editModal, setEditModal] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    cognome: "",
    email: "",
    telefono: "",
  });

  const [editForm, setEditForm] = useState(null);

  // -------------------------------
  // LOAD
  // -------------------------------
  const loadSoci = async () => {
    const r = await api.get("/soci");
    setSoci(r.data);
  };

  const loadQuote = async () => {
    const r = await api.get("/quote");
    setQuote(r.data);
  };

  useEffect(() => {
    loadSoci();
    loadQuote();
  }, []);

  // -------------------------------
  // SOCIO IN REGOLA?
  // -------------------------------
  const isInRegola = (id) => {
    return quote.some((q) => q.persona_id === id && q.pagata === true);
  };

  // -------------------------------
  // ADD
  // -------------------------------
  const addSocio = async () => {
    await api.post("/soci", form);
    setShowModal(false);
    setForm({ nome: "", cognome: "", email: "", telefono: "" });
    loadSoci();
  };

  // -------------------------------
  // DELETE
  // -------------------------------
  const deleteSocio = async (id) => {
    await api.delete(`/soci/${id}`);
    loadSoci();
  };

  // -------------------------------
  // EDIT
  // -------------------------------
  const updateSocio = async () => {
    await api.patch(`/soci/${editForm.id}`, editForm);
    setEditModal(false);
    setEditForm(null);
    loadSoci();
  };

  // -------------------------------
  // RENDER
  // -------------------------------
  return (
    <div className="space-y-6 text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Soci</h1>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 rounded"
        >
          Nuovo socio
        </button>
      </div>

      {/* LISTA */}
      <div className="space-y-2">
        {soci.map((s) => (
          <div
            key={s.id}
            className="p-4 bg-white/10 rounded-lg flex justify-between items-center"
          >
            <div>
              <div className="font-semibold">
                {s.nome} {s.cognome}
              </div>
              <div className="text-sm text-white/60">{s.email}</div>
              <div className="text-sm text-white/60">{s.telefono}</div>

              <div className="text-xs mt-1">
                {isInRegola(s.id) ? (
                  <span className="text-green-400">In regola</span>
                ) : (
                  <span className="text-red-400">Non in regola</span>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setEditForm(s);
                  setEditModal(true);
                }}
                className="px-3 py-1 bg-yellow-600 rounded"
              >
                Modifica
              </button>

              <button
                onClick={() => deleteSocio(s.id)}
                className="px-3 py-1 bg-red-600 rounded"
              >
                Elimina
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODALE NUOVO SOCIO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white text-black p-6 rounded w-80 space-y-4">
            <h2 className="text-xl font-bold">Nuovo socio</h2>

            <input
              type="text"
              placeholder="Nome"
              className="border p-2 w-full rounded"
              value={form.nome}
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />

            <input
              type="text"
              placeholder="Cognome"
              className="border p-2 w-full rounded"
              value={form.cognome}
              onChange={(e) => setForm({ ...form, cognome: e.target.value })}
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
              onClick={addSocio}
              className="w-full bg-blue-600 text-white p-2 rounded"
            >
              Salva
            </button>

            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-gray-300 p-2 rounded"
            >
              Annulla
            </button>
          </div>
        </div>
      )}

      {/* MODALE MODIFICA SOCIO */}
      {editModal && editForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
