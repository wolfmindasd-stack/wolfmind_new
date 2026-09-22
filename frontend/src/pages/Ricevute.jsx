import React, { useState, useEffect } from "react";
import { api, fmtEur, fmtDate } from "../lib/api";

export default function Ricevute() {
  const [ricevute, setRicevute] = useState([]);
  const [movimenti, setMovimenti] = useState([]);
  const [tesserati, setTesserati] = useState([]);
  const [soci, setSoci] = useState([]);
  const [pacchetti, setPacchetti] = useState([]);
  const [abbonamenti, setAbbonamenti] = useState([]);

  const [filtro, setFiltro] = useState({
    dataDa: "",
    dataA: "",
    persona: "",
    importoMin: "",
    importoMax: "",
  });

  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    data: "",
    persona_id: "",
    persona_tipo: "",
    descrizione: "",
    importo: "",
    movimento_id: "",
  });

  // LOAD DATA
  const loadRicevute = async () => {
    const res = await api.get("/ricevute");
    setRicevute(res.data);
  };

  const loadMovimenti = async () => {
    const res = await api.get("/movimenti");
    setMovimenti(res.data);
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
    loadRicevute();
    loadMovimenti();
    loadTesserati();
    loadSoci();
    loadPacchetti();
    loadAbbonamenti();
  }, []);
  const ricevuteFiltrate = ricevute.filter((r) => {
    const d = new Date(r.data);

    const okDa = filtro.dataDa ? d >= new Date(filtro.dataDa) : true;
    const okA = filtro.dataA ? d <= new Date(filtro.dataA) : true;
    const okPersona = filtro.persona
      ? r.persona_nome?.toLowerCase().includes(filtro.persona.toLowerCase())
      : true;

    const okMin = filtro.importoMin ? r.importo >= Number(filtro.importoMin) : true;
    const okMax = filtro.importoMax ? r.importo <= Number(filtro.importoMax) : true;

    return okDa && okA && okPersona && okMin && okMax;
  });
  const addRicevuta = async () => {
    await api.post("/ricevute", form);
    setShowModal(false);
    setForm({
      data: "",
      persona_id: "",
      persona_tipo: "",
      descrizione: "",
      importo: "",
      movimento_id: "",
    });
    loadRicevute();
  };
  const deleteRicevuta = async (id) => {
    await api.delete(`/ricevute/${id}`);
    loadRicevute();
  };
  const downloadPDF = async (id) => {
    const res = await api.get(`/ricevute/${id}/pdf`, {
      responseType: "blob",
    });

    const url = URL.createObjectURL(res.data);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ricevuta_${id}.pdf`;
    a.click();
    URL.revokeObjectURL(url);
  };
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">Ricevute</h1>

      {/* FILTRI */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
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

        <input
          className="border p-2"
          placeholder="Importo minimo"
          value={filtro.importoMin}
          onChange={(e) => setFiltro({ ...filtro, importoMin: e.target.value })}
        />

        <input
          className="border p-2"
          placeholder="Importo massimo"
          value={filtro.importoMax}
          onChange={(e) => setFiltro({ ...filtro, importoMax: e.target.value })}
        />
      </div>

      <button
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
        onClick={() => setShowModal(true)}
      >
        Nuova ricevuta
      </button>

      {/* TABELLA */}
      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 border">Data</th>
            <th className="p-2 border">Persona</th>
            <th className="p-2 border">Descrizione</th>
            <th className="p-2 border">Importo</th>
            <th className="p-2 border">Azioni</th>
          </tr>
        </thead>
        <tbody>
          {ricevuteFiltrate.map((r) => (
            <tr key={r.id}>
              <td className="p-2 border">{fmtDate(r.data)}</td>
              <td className="p-2 border">{r.persona_nome}</td>
              <td className="p-2 border">{r.descrizione}</td>
              <td className="p-2 border">{fmtEur(r.importo)}</td>
              <td className="p-2 border">
                <button
                  className="bg-green-600 text-white px-3 py-1 rounded mr-2"
                  onClick={() => downloadPDF(r.id)}
                >
                  PDF
                </button>

                <button
                  className="bg-red-600 text-white px-3 py-1 rounded"
                  onClick={() => deleteRicevuta(r.id)}
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
            <h2 className="text-xl font-bold mb-4">Nuova ricevuta</h2>

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
              className="border p-2 w-full mb-2"
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

            <select
              className="border p-2 w-full mb-4"
              value={form.movimento_id}
              onChange={(e) => setForm({ ...form, movimento_id: e.target.value })}
            >
              <option value="">Collega movimento</option>
              {movimenti.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.descrizione} — {fmtEur(m.importo)}
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
                onClick={addRicevuta}
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

