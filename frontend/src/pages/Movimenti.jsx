import React, { useState, useEffect } from "react";
import { api, fmtEur } from "../lib/api";

export default function Movimenti() {
  const [movimenti, setMovimenti] = useState([]);
  const [ricevute, setRicevute] = useState([]);
  const [tesserati, setTesserati] = useState([]);
  const [soci, setSoci] = useState([]);
  const [pacchetti, setPacchetti] = useState([]);
  const [abbonamenti, setAbbonamenti] = useState([]);

  const [filtro, setFiltro] = useState({
    tipo: "",
    dataDa: "",
    dataA: "",
    persona: "",
  });

  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    tipo: "",
    descrizione: "",
    importo: "",
    data: "",
    persona_id: "",
    persona_tipo: "",
  });

  // LOAD DATA
  const loadMovimenti = async () => {
    const res = await api.get("/movimenti");
    setMovimenti(res.data);
  };

  const loadRicevute = async () => {
    const res = await api.get("/ricevute");
    setRicevute(res.data);
  };

  const loadTesserati = async () => {
    const res = await api.get("/tesserati");
    setTesserati(res.data);
  };

  const loadSoci = async () => {
    const res = await api.get("/soci");
    setSoci(res.data);
  };

  const loadPacchetti = async () => {
    const res = await api.get("/pacchetti");
    setPacchetti(res.data);
  };

  const loadAbbonamenti = async () => {
    const res = await api.get("/abbonamenti");
    setAbbonamenti(res.data);
  };

  useEffect(() => {
    loadMovimenti();
    loadRicevute();
    loadTesserati();
    loadSoci();
    loadPacchetti();
    loadAbbonamenti();
  }, []);
  const movimentiFiltrati = movimenti.filter((m) => {
    const d = new Date(m.data);

    const okTipo = filtro.tipo ? m.tipo === filtro.tipo : true;
    const okDa = filtro.dataDa ? d >= new Date(filtro.dataDa) : true;
    const okA = filtro.dataA ? d <= new Date(filtro.dataA) : true;
    const okPersona = filtro.persona ? m.persona_nome?.includes(filtro.persona) : true;

    return okTipo && okDa && okA && okPersona;
  });
  const addMovimento = async () => {
    await api.post("/movimenti", form);
    setShowModal(false);
    setForm({
      tipo: "",
      descrizione: "",
      importo: "",
      data: "",
      persona_id: "",
      persona_tipo: "",
    });
    loadMovimenti();
  };
  const deleteMovimento = async (id) => {
    await api.delete(`/movimenti/${id}`);
    loadMovimenti();
  };
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">Movimenti</h1>

      {/* FILTRI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <select
          className="border p-2"
          value={filtro.tipo}
          onChange={(e) => setFiltro({ ...filtro, tipo: e.target.value })}
        >
          <option value="">Tipo</option>
          <option value="entrata">Entrata</option>
          <option value="uscita">Uscita</option>
        </select>

        <input
          type="date"
          className="border p-2"
          value={filtro.dataDa}
          onChange={(e) => setFiltro({ ...filtro, dataDa: e.target.value })}
        />

        <input
          type="date"
          className="border p-2"
          value={filtro.dataA}
          onChange={(e) => setFiltro({ ...filtro, dataA: e.target.value })}
        />

        <input
          className="border p-2"
          placeholder="Persona"
          value={filtro.persona}
          onChange={(e) => setFiltro({ ...filtro, persona: e.target.value })}
        />
      </div>

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
        onClick={() => setShowModal(true)}
      >
        Nuovo movimento
      </button>

      {/* TABELLA */}
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 border">Data</th>
            <th className="p-2 border">Tipo</th>
            <th className="p-2 border">Descrizione</th>
            <th className="p-2 border">Persona</th>
            <th className="p-2 border">Importo</th>
            <th className="p-2 border">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {movimentiFiltrati.map((m) => (
            <tr key={m.id}>
              <td className="p-2 border">{m.data}</td>
              <td className="p-2 border">{m.tipo}</td>
              <td className="p-2 border">{m.descrizione}</td>
              <td className="p-2 border">{m.persona_nome}</td>
              <td className="p-2 border">{fmtEur(m.importo)}</td>
              <td className="p-2 border">
                <button
                  className="bg-red-600 text-white px-3 py-1 rounded"
                  onClick={() => deleteMovimento(m.id)}
                >
                  Elimina
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">Nuovo movimento</h2>

            <select
              className="border p-2 w-full mb-2"
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            >
              <option value="">Tipo</option>
              <option value="entrata">Entrata</option>
              <option value="uscita">Uscita</option>
            </select>

            <input
              className="border p-2 w-full mb-2"
              placeholder="Descrizione"
              value={form.descrizione}
              onChange={(e) => setForm({ ...form, descrizione: e.target.value })}
            />

            <input
              type="number"
              className="border p-2 w-full mb-2"
              placeholder="Importo"
              value={form.importo}
              onChange={(e) => setForm({ ...form, importo: e.target.value })}
            />

            <input
              type="date"
              className="border p-2 w-full mb-2"
              value={form.data}
              onChange={(e) => setForm({ ...form, data: e.target.value })}
            />

            <select
              className="border p-2 w-full mb-2"
              value={form.persona_tipo}
              onChange={(e) => setForm({ ...form, persona_tipo: e.target.value })}
            >
              <option value="">Tipo persona</option>
              <option value="tesserato">Tesserato</option>
              <option value="socio">Socio</option>
            </select>

            <select
              className="border p-2 w-full mb-4"
              value={form.persona_id}
              onChange={(e) => setForm({ ...form, persona_id: e.target.value })}
            >
              <option value="">Seleziona persona</option>

              {form.persona_tipo === "tesserato" &&
                tesserati.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nome}
                  </option>
                ))}

              {form.persona_tipo === "socio" &&
                soci.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.nome}
                  </option>
                ))}
            </select>

            <div className="flex justify-between">
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded"
                onClick={() => setShowModal(false)}
              >
                Annulla
              </button>

              <button
                className="bg-green-600 text-white px-4 py-2 rounded"
                onClick={addMovimento}
              >
                Salva
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
