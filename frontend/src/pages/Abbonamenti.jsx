import React, { useState, useEffect } from "react";
import { api, fmtEur } from "../lib/api";

export default function Abbonamenti() {
  const [abbonamenti, setAbbonamenti] = useState([]);
  const [tesserati, setTesserati] = useState([]);
  const [pacchetti, setPacchetti] = useState([]);
  const [movimenti, setMovimenti] = useState([]);
  const [ricevute, setRicevute] = useState([]);

  const [form, setForm] = useState({
    tesserato_id: "",
    pacchetto_id: "",
    data_inizio: "",
    data_fine: "",
    importo: "",
  });

  // -------------------------------
  // LOAD DATA
  // -------------------------------
  const loadAbbonamenti = async () => {
    const res = await api.get("/abbonamenti");
    setAbbonamenti(res.data);
  };

  const loadTesserati = async () => {
    const res = await api.get("/tesserati");
    setTesserati(res.data);
  };

  const loadPacchetti = async () => {
    const res = await api.get("/pacchetti");
    setPacchetti(res.data);
  };

  const loadMovimenti = async () => {
    const res = await api.get("/movimenti");
    setMovimenti(res.data);
  };

  const loadRicevute = async () => {
    const res = await api.get("/ricevute");
    setRicevute(res.data);
  };

  useEffect(() => {
    loadAbbonamenti();
    loadTesserati();
    loadPacchetti();
    loadMovimenti();
    loadRicevute();
  }, []);

  // -------------------------------
  // ADD ABBONAMENTO
  // -------------------------------
  const addAbbonamento = async () => {
    await api.post("/abbonamenti", form);
    setForm({
      tesserato_id: "",
      pacchetto_id: "",
      data_inizio: "",
      data_fine: "",
      importo: "",
    });
    loadAbbonamenti();
  };

  // -------------------------------
  // RENDER
  // -------------------------------
  return (
    <div className="p-4 space-y-6">
      <h1 className="text-3xl font-bold text-white">Abbonamenti</h1>

      {/* FORM */}
      <div className="bg-white/10 p-4 rounded-lg space-y-4">
        <h2 className="text-xl font-bold text-white">Nuovo Abbonamento</h2>

        <select
          className="border p-2 rounded w-full bg-white/20 text-white"
          value={form.tesserato_id}
          onChange={(e) =>
            setForm({ ...form, tesserato_id: e.target.value })
          }
        >
          <option value="">Seleziona tesserato</option>
          {tesserati.map((t) => (
            <option key={t.id} value={t.id}>
              {t.nome} {t.cognome}
            </option>
          ))}
        </select>

        <select
          className="border p-2 rounded w-full bg-white/20 text-white"
          value={form.pacchetto_id}
          onChange={(e) =>
            setForm({ ...form, pacchetto_id: e.target.value })
          }
        >
          <option value="">Seleziona pacchetto</option>
          {pacchetti.map((p) => (
            <option key={p.id} value={p.id}>
              {p.nome} — {fmtEur(p.prezzo)}
            </option>
          ))}
        </select>

        <input
          type="date"
          className="border p-2 rounded w-full bg-white/20 text-white"
          value={form.data_inizio}
          onChange={(e) =>
            setForm({ ...form, data_inizio: e.target.value })
          }
        />

        <input
          type="date"
          className="border p-2 rounded w-full bg-white/20 text-white"
          value={form.data_fine}
          onChange={(e) =>
            setForm({ ...form, data_fine: e.target.value })
          }
        />

        <input
          type="number"
          className="border p-2 rounded w-full bg-white/20 text-white"
          value={form.importo}
          onChange={(e) =>
            setForm({ ...form, importo: e.target.value })
          }
          placeholder="Importo"
        />

        <button
          className="px-4 py-2 bg-green-600 text-white rounded-lg"
          onClick={addAbbonamento}
        >
          Salva
        </button>
      </div>

      {/* LISTA ABBONAMENTI */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold text-white">Lista Abbonamenti</h2>

        {abbonamenti.map((a) => (
          <div
            key={a.id}
            className="p-4 bg-white/10 rounded-lg text-white flex justify-between"
          >
            <div>
              <div className="font-semibold">
                {a.tesserato_nome} — {a.pacchetto_nome}
              </div>
              <div className="text-sm text-white/60">
                {a.data_inizio} → {a.data_fine}
              </div>
            </div>

            <div className="font-bold">{fmtEur(a.importo)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
