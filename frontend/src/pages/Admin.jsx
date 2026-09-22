import React, { useState, useEffect } from "react";
import { api, fmtEur } from "../lib/api";

export default function Admin() {
  const [tab, setTab] = useState("tesserati");

  // -------------------------------
  // TIPI TESSERATI
  // -------------------------------
  const [tipi, setTipi] = useState([]);
  const [newTipo, setNewTipo] = useState("");

  const loadTipi = async () => {
    const res = await api.get("/tipologie-tesserato");
    setTipi(res.data);
  };

  const addTipo = async () => {
    await api.post("/tipologie-tesserato", { nome: newTipo });
    setNewTipo("");
    loadTipi();
  };

  // -------------------------------
  // TESSERATI
  // -------------------------------
  const [tesserati, setTesserati] = useState([]);
  const [newTesserato, setNewTesserato] = useState({ nome: "", tipo: "" });

  const loadTesserati = async () => {
    const res = await api.get("/tesserati");
    setTesserati(res.data);
  };

  const addTesserato = async () => {
    await api.post("/tesserati", newTesserato);
    setNewTesserato({ nome: "", tipo: "" });
    loadTesserati();
  };

  // -------------------------------
  // SOCI
  // -------------------------------
  const [soci, setSoci] = useState([]);
  const loadSoci = async () => {
    const res = await api.get("/soci");
    setSoci(res.data);
  };

  // -------------------------------
  // PACCHETTI
  // -------------------------------
  const [pacchetti, setPacchetti] = useState([]);
  const loadPacchetti = async () => {
    const res = await api.get("/pacchetti");
    setPacchetti(res.data);
  };

  const addPacchetto = async (p) => {
    await api.post("/pacchetti", p);
    loadPacchetti();
  };

  // -------------------------------
  // MOVIMENTI
  // -------------------------------
  const [movimenti, setMovimenti] = useState([]);
  const loadMovimenti = async () => {
    const res = await api.get("/movimenti");
    setMovimenti(res.data);
  };

  const addMovimento = async (m) => {
    await api.post("/movimenti", m);
    loadMovimenti();
  };

  // -------------------------------
  // RICEVUTE
  // -------------------------------
  const [ricevute, setRicevute] = useState([]);
  const loadRicevute = async () => {
    const res = await api.get("/ricevute");
    setRicevute(res.data);
  };

  const addRicevuta = async (r) => {
    await api.post("/ricevute", r);
    loadRicevute();
  };

  // -------------------------------
  // LOAD ALL ON START
  // -------------------------------
  useEffect(() => {
    loadTipi();
    loadTesserati();
    loadSoci();
    loadPacchetti();
    loadMovimenti();
    loadRicevute();
  }, []);

  // -------------------------------
  // RENDER
  // -------------------------------
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">Pannello Admin</h1>

      {/* MENU */}
      <div className="flex gap-2 mb-4">
        {[
          "tesserati",
          "soci",
          "pacchetti",
          "movimenti",
          "ricevute",
          "tipi",
        ].map((t) => (
          <button
            key={t}
            className={`px-4 py-2 rounded ${
              tab === t ? "bg-blue-600 text-white" : "bg-gray-200"
            }`}
            onClick={() => setTab(t)}
          >
            {t.toUpperCase()}
          </button>
        ))}
      </div>

      {/* TIPI TESSERATI */}
      {tab === "tipi" && (
        <div>
          <h2 className="text-xl font-bold mb-2">Tipologie Tesserati</h2>

          <ul className="mb-4">
            {tipi.map((t) => (
              <li key={t.id}>{t.nome}</li>
            ))}
          </ul>

          <input
            className="border p-2 mr-2"
            value={newTipo}
            onChange={(e) => setNewTipo(e.target.value)}
            placeholder="Nuova tipologia"
          />
          <button className="bg-green-600 text-white px-4 py-2" onClick={addTipo}>
            Aggiungi
          </button>
        </div>
      )}

      {/* TESSERATI */}
      {tab === "tesserati" && (
        <div>
          <h2 className="text-xl font-bold mb-2">Tesserati</h2>

          <ul className="mb-4">
            {tesserati.map((t) => (
              <li key={t.id}>
                {t.nome} — {t.tipo}
              </li>
            ))}
          </ul>

          <input
            className="border p-2 mr-2"
            value={newTesserato.nome}
            onChange={(e) =>
              setNewTesserato({ ...newTesserato, nome: e.target.value })
            }
            placeholder="Nome"
          />
          <input
            className="border p-2 mr-2"
            value={newTesserato.tipo}
            onChange={(e) =>
              setNewTesserato({ ...newTesserato, tipo: e.target.value })
            }
            placeholder="Tipo"
          />
          <button
            className="bg-green-600 text-white px-4 py-2"
            onClick={addTesserato}
          >
            Aggiungi
          </button>
        </div>
      )}

      {/* SOCI */}
      {tab === "soci" && (
        <div>
          <h2 className="text-xl font-bold mb-2">Soci</h2>
          <ul>
            {soci.map((s) => (
              <li key={s.id}>{s.nome}</li>
            ))}
          </ul>
        </div>
      )}

      {/* PACCHETTI */}
      {tab === "pacchetti" && (
        <div>
          <h2 className="text-xl font-bold mb-2">Pacchetti</h2>
          <ul>
            {pacchetti.map((p) => (
              <li key={p.id}>
                {p.nome} — {fmtEur(p.prezzo)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* MOVIMENTI */}
      {tab === "movimenti" && (
        <div>
          <h2 className="text-xl font-bold mb-2">Movimenti</h2>
          <ul>
            {movimenti.map((m) => (
              <li key={m.id}>
                {m.descrizione} — {fmtEur(m.importo)}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* RICEVUTE */}
      {tab === "ricevute" && (
        <div>
          <h2 className="text-xl font-bold mb-2">Ricevute</h2>
          <ul>
            {ricevute.map((r) => (
              <li key={r.id}>
                Ricevuta #{r.id} — {fmtEur(r.importo)}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
