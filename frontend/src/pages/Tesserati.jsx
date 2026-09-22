import React, { useState, useEffect } from "react";
import { api, fmtDate } from "../lib/api";

export default function Tesserati() {
  const [items, setItems] = useState([]);
  const [pacchetti, setPacchetti] = useState([]);
  const [abbonamenti, setAbbonamenti] = useState([]);

  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    cognome: "",
    email: "",
    telefono: "",
    scadenza_tesseramento: "",
    scadenza_visita_medica: "",
    pacchetto_id: "",
    abbonamento_id: "",
  });

  const [editForm, setEditForm] = useState({
    id: "",
    nome: "",
    cognome: "",
    email: "",
    telefono: "",
    scadenza_tesseramento: "",
    scadenza_visita_medica: "",
    pacchetto_id: "",
    abbonamento_id: "",
  });

  // -------------------------------
  // LOAD DATA
  // -------------------------------
  const load = async () => {
    const r1 = await api.get("/tesserati");
    const r2 = await api.get("/pacchetti");
    const r3 = await api.get("/abbonamenti");

    setItems(r1.data);
    setPacchetti(r2.data);
    setAbbonamenti(r3.data);
  };

  useEffect(() => {
    load();
  }, []);

  // -------------------------------
  // FILTRO
  // -------------------------------
  const filtered = items.filter((t) => {
    const s = search.toLowerCase();
    return (
      t.nome.toLowerCase().includes(s) ||
      t.cognome.toLowerCase().includes(s) ||
      t.email?.toLowerCase().includes(s)
    );
  });

  // -------------------------------
  // NUOVO TESSERATO
  // -------------------------------
  const save = async () => {
    await api.post("/tesserati", form);
    setShowModal(false);
    setForm({
      nome: "",
      cognome: "",
      email: "",
      telefono: "",
      scadenza_tesseramento: "",
      scadenza_visita_medica: "",
      pacchetto_id: "",
      abbonamento_id: "",
    });
    load();
  };

  // -------------------------------
  // ELIMINA TESSERATO
  // -------------------------------
  const del = async (id) => {
    await api.delete(`/tesserati/${id}`);
    load();
  };

  // -------------------------------
  // APRI MODIFICA
  // -------------------------------
  const openEdit = (t) => {
    setEditForm({
      id: t.id,
      nome: t.nome,
      cognome: t.cognome,
      email: t.email,
      telefono: t.telefono,
      scadenza_tesseramento: t.scadenza_tesseramento,
      scadenza_visita_medica: t.scadenza_visita_medica,
      pacchetto_id: t.pacchetto_id,
      abbonamento_id: t.abbonamento_id,
    });
    setShowEditModal(true);
  };

  // -------------------------------
  // SALVA MODIFICA
  // -------------------------------
  const update = async () => {
    await api.put(`/tesserati/${editForm.id}`, editForm);
    setShowEditModal(false);
    load();
  };

  // -------------------------------
  // SCADENZE
  // -------------------------------
  const isExpiring = (date) => {
    if (!date) return false;
    const d = new Date(date);
    const now = new Date();
    const diff = (d - now) / (1000 * 60 * 60 * 24);
    return diff < 30;
  };

  // -------------------------------
  // RENDER
  // -------------------------------
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Tesserati</h1>
        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-[#007AFF] text-white rounded-lg text-sm"
        >
          Nuovo tesserato
        </button>
      </div>

           <input
        type="text"
        placeholder="Cerca…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2 rounded-lg bg-white/10 text-white"
      />

      <div className="space-y-2">
        {filtered.map((t) => (
          <div
            key={t.id}
            className="p-4 bg-white/10 rounded-lg hover:bg-white/20 transition cursor-pointer"
            onClick={() => openEdit(t)}
          >
            <div className="font-medium text-white">
              {t.cognome} {t.nome}
            </div>
            <div className="text-xs text-white/50">
              {t.email} · {t.telefono}
            </div>
            <div className="text-xs text-white/50">
              Tesseramento: {fmtDate(t.scadenza_tesseramento)}
              {" · "}
              Visita: {fmtDate(t.scadenza_visita_medica)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
