import React, { useState, useEffect } from "react";
import { api, fmtEur } from "../lib/api";

export default function Compensi() {
  const [compensi, setCompensi] = useState([]);
  const [istruttori, setIstruttori] = useState([]);
  const [collaboratori, setCollaboratori] = useState([]);
  const [movimenti, setMovimenti] = useState([]);
  const [ricevute, setRicevute] = useState([]);

  const [form, setForm] = useState({
    persona_id: "",
    tipo_persona: "",
    descrizione: "",
    importo: "",
    data: "",
  });

  const [filtroMese, setFiltroMese] = useState("");
  const [filtroAnno, setFiltroAnno] = useState("");

  const [showModal, setShowModal] = useState(false);

  // -------------------------------
  // LOAD DATA
  // -------------------------------
  const loadCompensi = async () => {
    const res = await api.get("/compensi");
    setCompensi(res.data);
  };

  const loadIstruttori = async () => {
    const res = await api.get("/istruttori");
    setIstruttori(res.data);
  };

  const loadCollaboratori = async () => {
    const res = await api.get("/collaboratori");
    setCollaboratori(res.data);
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
    loadCompensi();
    loadIstruttori();
    loadCollaboratori();
    loadMovimenti();
    loadRicevute();
  }, []);

  // -------------------------------
  // ADD COMPENSO
  // -------------------------------
  const addCompenso = async () => {
    await api.post("/compensi", form);
    setShowModal(false);
    setForm({
      persona_id: "",
      tipo_persona: "",
      descrizione: "",
      importo: "",
      data: "",
    });
    loadCompensi();
  };

  // -------------------------------
  // DELETE COMPENSO
  // -------------------------------
  const deleteCompenso = async (id) => {
    await api.delete(`/compensi/${id}`);
    loadCompensi();
  };

  // -------------------------------
  // FILTRI
  // -------------------------------
  const compensiFiltrati = compensi.filter((c) => {
    const d = new Date(c.data);
    const mese = d.getMonth() + 1;
    const anno = d.getFullYear();

    return (
      (filtroMese ? mese === Number(filtroMese) : true) &&
      (filtroAnno ? anno === Number(filtroAnno) : true)
    );
  });

  // -------------------------------
  // RENDER
  // -------------------------------
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">Compensi</h1>

           {/* FILTRI */}
      <div className="flex gap-4 mb-4">
        <select
          className="border p-2 rounded"
          value={filtroMese}
          onChange={(e) => setFiltroMese(e.target.value)}
        >
          <option value="">Tutti i mesi</option>
          {[...Array(12)].map((_, i) => (
            <option key={i + 1} value={i + 1}>
              {i + 1}
            </option>
          ))}
        </select>

        <select
          className="border p-2 rounded"
          value={filtroAnno}
          onChange={(e) => setFiltroAnno(e.target.value)}
        >
          <option value="">Tutti gli anni</option>
          {[2023, 2024, 2025, 2026].map((y) => (
            <option key={y} value={y}>
              {y}
            </option>
          ))}
        </select>
      </div>

      {/* LISTA COMPENSI */}
      <div className="space-y-2">
        {compensiFiltrati.map((c) => (
          <div
            key={c.id}
            className="p-4 bg-gray-100 rounded flex justify-between items-center"
          >
            <div>
              <div className="font-semibold">{c.descrizione}</div>
              <div className="text-sm text-gray-600">
                {fmtEur(c.importo)} — {c.data}
              </div>
            </div>

            <button
              onClick={() => deleteCompenso(c.id)}
              className="px-3 py-1 bg-red-500 text-white rounded"
            >
              Elimina
            </button>
          </div>
        ))}
      </div>

      {/* MODALE NUOVO COMPENSO */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-80 space-y-4">
            <h2 className="text-xl font-bold">Nuovo compenso</h2>

            <input
              type="text"
              placeholder="Descrizione"
              className="border p-2 w-full rounded"
              value={form.descrizione}
              onChange={(e) =>
                setForm({ ...form, descrizione: e.target.value })
              }
            />

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

            <button
              onClick={addCompenso}
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

