import React, { useState, useEffect } from "react";
import { api, fmtEur, fmtDate } from "../lib/api";

export default function Quote() {
  const [quote, setQuote] = useState([]);
  const [persone, setPersone] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    persona_id: "",
    importo: "",
    data: "",
    anno: new Date().getFullYear(),
  });

  // -------------------------------
  // LOAD
  // -------------------------------
  const loadQuote = async () => {
    const r = await api.get("/quote");
    setQuote(r.data);
  };

  const loadPersone = async () => {
    const r = await api.get("/tesserati");
    setPersone(r.data);
  };

  useEffect(() => {
    loadQuote();
    loadPersone();
  }, []);

  // -------------------------------
  // ADD
  // -------------------------------
  const addQuota = async () => {
    await api.post("/quote", form);
    setShowModal(false);
    setForm({
      persona_id: "",
      importo: "",
      data: "",
      anno: new Date().getFullYear(),
    });
    loadQuote();
  };

  // -------------------------------
  // SEGNA COME PAGATA
  // -------------------------------
  const segnaPagata = async (id) => {
    await api.patch(`/quote/${id}/pagata`);
    loadQuote();
  };

  // -------------------------------
  // DELETE
  // -------------------------------
  const del = async (id) => {
    await api.delete(`/quote/${id}`);
    loadQuote();
  };

  // -------------------------------
  // RENDER
  // -------------------------------
  return (
    <div className="space-y-6 text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Quote sociali</h1>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 rounded"
        >
          Nuova quota
        </button>
      </div>

      {/* LISTA */}
      <div className="space-y-2">
        {quote.map((q) => (
          <div
            key={q.id}
            className="p-4 bg-white/10 rounded-lg flex justify-between items-center"
          >
            <div>
              <div className="font-semibold">
                {q.persona_nome} {q.persona_cognome}
              </div>
              <div className="text-sm text-white/60">
                {fmtEur(q.importo)} — {fmtDate(q.data)} — Anno {q.anno}
              </div>
              <div className="text-xs text-white/50">
                Stato: {q.pagata ? "Pagata" : "Non pagata"}
              </div>
            </div>

            <div className="flex gap-2">
              {!q.pagata && (
                <button
                  onClick={() => segnaPagata(q.id)}
                  className="px-3 py-1 bg-green-600 rounded"
                >
                  Segna pagata
                </button>
              )}

              <button
                onClick={() => del(q.id)}
                className="px-3 py-1 bg-red-600 rounded"
              >
                Elimina
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* MODALE */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white text-black p-6 rounded w-80 space-y-4">
            <h2 className="text-xl font-bold">Nuova quota</h2>

            <select
              className="border p-2 w-full rounded"
              value={form.persona_id}
              onChange={(e) =>
                setForm({ ...form, persona_id: e.target.value })
              }
            >
              <option value="">Seleziona persona</option>
              {persone.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.nome} {p.cognome}
                </option>
              ))}
            </select>

            <input
              type="number"
              placeholder="Importo"
              className="border p-2 w-full rounded"
              value={form.importo}
              onChange={(e) =>
                setForm({ ...form, importo: e.target.value })
              }
            />

            <input
              type="date"
              className="border p-2 w-full rounded"
              value={form.data}
              onChange={(e) => setForm({ ...form, data: e.target.value })}
            />

            <input
              type="number"
              placeholder="Anno"
              className="border p-2 w-full rounded"
              value={form.anno}
              onChange={(e) => setForm({ ...form, anno: e.target.value })}
            />

            <button
              onClick={addQuota}
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
    </div>
  );
}
