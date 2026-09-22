import React, { useState, useEffect } from "react";
import { api } from "../lib/api";

export default function LibroSoci() {
  const [soci, setSoci] = useState([]);
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroStato, setFiltroStato] = useState("");

  const [quote, setQuote] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formQuota, setFormQuota] = useState({
    socio_id: "",
    importo: "",
    data: "",
  });

  // -------------------------------
  // LOAD SOCI
  // -------------------------------
  const loadSoci = async () => {
    const res = await api.get("/soci");
    setSoci(res.data);
  };

  // -------------------------------
  // LOAD QUOTE
  // -------------------------------
  const loadQuote = async () => {
    const res = await api.get("/quote");
    setQuote(res.data);
  };

  useEffect(() => {
    loadSoci();
    loadQuote();
  }, []);

  // -------------------------------
  // FILTRI
  // -------------------------------
  const sociFiltrati = soci.filter((s) => {
    return (
      (filtroNome
        ? s.nome.toLowerCase().includes(filtroNome.toLowerCase())
        : true) &&
      (filtroStato ? s.stato === filtroStato : true)
    );
  });

  // -------------------------------
  // ADD QUOTA
  // -------------------------------
  const addQuota = async () => {
    await api.post("/quote", formQuota);
    setShowModal(false);
    setFormQuota({ socio_id: "", importo: "", data: "" });
    loadQuote();
  };

  // -------------------------------
  // RENDER
  // -------------------------------
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Libro Soci</h1>

      {/* FILTRI */}
      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Cerca per nome…"
          value={filtroNome}
          onChange={(e) => setFiltroNome(e.target.value)}
          className="px-4 py-2 rounded bg-white/10 text-white"
        />

        <select
          value={filtroStato}
          onChange={(e) => setFiltroStato(e.target.value)}
          className="px-4 py-2 rounded bg-white/10 text-white"
        >
          <option value="">Tutti</option>
          <option value="in_regola">In regola</option>
          <option value="non_in_regola">Non in regola</option>
        </select>
      </div>

      {/* LISTA SOCI */}
      <div className="space-y-2">
        {sociFiltrati.map((s) => (
          <div
            key={s.id}
            className="p-4 bg-white/10 rounded-lg hover:bg-white/20 transition"
          >
            <div className="font-medium text-white">
              {s.nome} {s.cognome}
            </div>
            <div className="text-sm text-white/60">{s.email}</div>

            {/* Stato quota */}
            <div className="text-xs text-white/50 mt-1">
              {quote.some((q) => q.socio_id === s.id)
                ? "🟢 In regola"
                : "🔴 Non in regola"}
            </div>
          </div>
        ))}
      </div>

      {/* MODALE NUOVA QUOTA */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-80 space-y-4">
            <h2 className="text-xl font-bold">Aggiungi quota</h2>

            <select
              className="border p-2 w-full rounded"
              value={formQuota.socio_id}
              onChange={(e) =>
                setFormQuota({ ...formQuota, socio_id: e.target.value })
              }
            >
              <option value="">Seleziona socio</option>
              {
