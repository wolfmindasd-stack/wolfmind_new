import React, { useState, useEffect } from "react";
import { api, fmtDate } from "../lib/api";

export default function Notifiche() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState("");

  // -------------------------------
  // LOAD NOTIFICHE
  // -------------------------------
  const load = async () => {
    const res = await api.get("/notifiche");
    setItems(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  // -------------------------------
  // FILTRI
  // -------------------------------
  const filtrate = items.filter((n) => {
    const s = search.toLowerCase();
    const okSearch =
      n.titolo.toLowerCase().includes(s) ||
      n.messaggio.toLowerCase().includes(s);

    const okCat = categoria ? n.categoria === categoria : true;

    return okSearch && okCat;
  });

  // -------------------------------
  // SEGNA COME LETTA
  // -------------------------------
  const segnaLetta = async (id) => {
    await api.patch(`/notifiche/${id}/letto`);
    load();
  };

  // -------------------------------
  // ELIMINA NOTIFICA
  // -------------------------------
  const del = async (id) => {
    await api.delete(`/notifiche/${id}`);
    load();
  };

  // -------------------------------
  // RENDER
  // -------------------------------
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Notifiche</h1>

      {/* FILTRI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="text"
          placeholder="Cerca…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full px-4 py-2 rounded-lg bg-white/10 text-white"
        />

        <select
          className="px-4 py-2 rounded-lg bg-white/10 text-white"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        >
          <option value="">Tutte le categorie</option>
          <option value="soci">Soci</option>
