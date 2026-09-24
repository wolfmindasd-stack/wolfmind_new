import React, { useState, useEffect } from "react";
import { api, fmtEur, fmtDate } from "../lib/api";

export default function Admin() {
  const [tipi, setTipi] = useState([]);
  const [tesserati, setTesserati] = useState([]);
  const [soci, setSoci] = useState([]);
  const [pacchetti, setPacchetti] = useState([]);
  const [movimenti, setMovimenti] = useState([]);
  const [ricevute, setRicevute] = useState([]);

  const [formTipo, setFormTipo] = useState({ nome: "" });
  const [formTesserato, setFormTesserato] = useState({
    nome: "",
    cognome: "",
    email: "",
  });
  const [formSocio, setFormSocio] = useState({
    nome: "",
    cognome: "",
    email: "",
  });
  const [formPacchetto, setFormPacchetto] = useState({
    nome: "",
    prezzo: "",
  });
  const [formMovimento, setFormMovimento] = useState({
    descrizione: "",
    importo: "",
    data: "",
  });
  const [formRicevuta, setFormRicevuta] = useState({
    persona_id: "",
    importo: "",
    data: "",
  });

  // LOAD
  const loadTipi = async () => {
    const r = await api.get("/tipi");
    setTipi(r.data);
  };

  const loadTesserati = async () => {
    const r = await api.get("/tesserati");
    setTesserati(r.data);
  };

  const loadSoci = async () => {
    const r = await api.get("/soci");
    setSoci(r.data);
  };

  const loadPacchetti = async () => {
    const r = await api.get("/pacchetti");
    setPacchetti(r.data);
  };

  const loadMovimenti = async () => {
    const r = await api.get("/movimenti");
    setMovimenti(r.data);
  };

  const loadRicevute = async () => {
    const r = await api.get("/ricevute");
    setRicevute(r.data);
  };

  useEffect(() => {
    loadTipi();
    loadTesserati();
    loadSoci();
    loadPacchetti();
    loadMovimenti();
    loadRicevute();
  }, []);

  // ADD
  const addTipo = async () => {
    await api.post("/tipi", formTipo);
    setFormTipo({ nome: "" });
    loadTipi();
  };

  const addTesserato = async () => {
    await api.post("/tesserati", formTesserato);
    setFormTesserato({ nome: "", cognome: "", email: "" });
    loadTesserati();
  };

  const addSocio = async () => {
    await api.post("/soci", formSocio);
    setFormSocio({ nome: "", cognome: "", email: "" });
    loadSoci();
  };

  const addPacchetto = async () => {
    await api.post("/pacchetti", formPacchetto);
    setFormPacchetto({ nome: "", prezzo: "" });
    loadPacchetti();
  };

  const addMovimento = async () => {
    await api.post("/movimenti", formMovimento);
    setFormMovimento({ descrizione: "", importo: "", data: "" });
    loadMovimenti();
  };

  const addRicevuta = async () => {
    await api.post("/ricevute", formRicevuta);
    setFormRicevuta({ persona_id: "", importo: "", data: "" });
    loadRicevute();
  };

  // RENDER
  return (
    <div className="space-y-10 text-white p-6">
      <h1 className="text-3xl font-bold">Pannello Admin</h1>

      {/* TIPI */}
      <section className="bg-white/10 p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Tipi</h2>

        <input
          type="text"
          className="border p-2 rounded w-full bg-white/20 text-white"
          placeholder="Nome tipo"
          value={formTipo.nome}
          onChange={(e) => setFormTipo({ nome: e.target.value })}
        />

        <button
          onClick={addTipo}
          className="mt-2 px-4 py-2 bg-blue-600 rounded"
        >
          Aggiungi tipo
        </button>

        <ul className="mt-4 space-y-1">
          {tipi.map((t) => (
            <li key={t.id} className="text-white/80">
              {t.nome}
            </li>
          ))}
        </ul>
      </section>

      {/* TESSERATI */}
      <section className="bg-white/10 p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Tesserati</h2>

        <input
          type="text"
          className="border p-2 rounded w-full bg-white/20 text-white"
          placeholder="Nome"
          value={formTesserato.nome}
          onChange={(e) =>
            setFormTesserato({ ...formTesserato, nome: e.target.value })
          }
        />

        <input
          type="text"
          className="border p-2 rounded w-full bg-white/20 text-white mt-2"
          placeholder="Cognome"
          value={formTesserato.cognome}
          onChange={(e) =>
            setFormTesserato({ ...formTesserato, cognome: e.target.value })
          }
        />

        <input
          type="email"
          className="border p-2 rounded w-full bg-white/20 text-white mt-2"
          placeholder="Email"
          value={formTesserato.email}
          onChange={(e) =>
            setFormTesserato({ ...formTesserato, email: e.target.value })
          }
        />

        <button
          onClick={addTesserato}
          className="mt-2 px-4 py-2 bg-blue-600 rounded"
        >
          Aggiungi tesserato
        </button>

        <ul className="mt-4 space-y-1">
          {tesserati.map((t) => (
            <li key={t.id} className="text-white/80">
              {t.nome} {t.cognome}
            </li>
          ))}
        </ul>
      </section>

      {/* SOCI */}
      <section className="bg-white/10 p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Soci</h2>

        <input
          type="text"
          className="border p-2 rounded w-full bg-white/20 text-white"
          placeholder="Nome"
          value={formSocio.nome}
          onChange={(e) =>
            setFormSocio({ ...formSocio, nome: e.target.value })
          }
        />

        <input
          type="text"
          className="border p-2 rounded w-full bg-white/20 text-white mt-2"
          placeholder="Cognome"
          value={formSocio.cognome}
          onChange={(e) =>
            setFormSocio({ ...formSocio, cognome: e.target.value })
          }
        />

        <input
          type="email"
          className="border p-2 rounded w-full bg-white/20 text-white mt-2"
          placeholder="Email"
          value={formSocio.email}
          onChange={(e) =>
            setFormSocio({ ...formSocio, email: e.target.value })
          }
        />

        <button
          onClick={addSocio}
          className="mt-2 px-4 py-2 bg-blue-600 rounded"
        >
          Aggiungi socio
        </button>

        <ul className="mt-4 space-y-1">
          {soci.map((s) => (
            <li key={s.id} className="text-white/80">
              {s.nome} {s.cognome}
            </li>
          ))}
        </ul>
      </section>

      {/* PACCHETTI */}
      <section className="bg-white/10 p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Pacchetti</h2>

        <input
          type="text"
          className="border p-2 rounded w-full bg-white/20 text-white"
          placeholder="Nome pacchetto"
          value={formPacchetto.nome}
          onChange={(e) =>
            setFormPacchetto({ ...formPacchetto, nome: e.target.value })
          }
        />

        <input
          type="number"
          className="border p-2 rounded w-full bg-white/20 text-white mt-2"
          placeholder="Prezzo"
          value={formPacchetto.prezzo}
          onChange={(e) =>
            setFormPacchetto({ ...formPacchetto, prezzo: e.target.value })
          }
        />

        <button
          onClick={addPacchetto}
          className="mt-2 px-4 py-2 bg-blue-600 rounded"
        >
          Aggiungi pacchetto
        </button>

        <ul className="mt-4 space-y-1">
          {pacchetti.map((p) => (
            <li key={p.id} className="text-white/80">
              {p.nome} — {fmtEur(p.prezzo)}
            </li>
          ))}
        </ul>
      </section>

      {/* MOVIMENTI */}
      <section className="bg-white/10 p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Movimenti</h2>

        <input
          type="text"
          className="border p-2 rounded w-full bg-white/20 text-white"
          placeholder="Descrizione"
          value={formMovimento.descrizione}
          onChange={(e) =>
            setFormMovimento({ ...formMovimento, descrizione: e.target.value })
          }
        />

        <input
          type="number"
          className="border p-2 rounded w-full bg-white/20 text-white mt-2"
          placeholder="Importo"
          value={formMovimento.importo}
          onChange={(e) =>
            setFormMovimento({ ...formMovimento, importo: e.target.value })
          }
        />

        <input
          type="date"
          className="border p-2 rounded w-full bg-white/20 text-white mt-2"
          value={formMovimento.data}
          onChange={(e) =>
            setFormMovimento({ ...formMovimento, data: e.target.value })
          }
        />

        <button
          onClick={addMovimento}
          className="mt-2 px-4 py-2 bg-blue-600 rounded"
        >
          Aggiungi movimento
        </button>

        <ul className="mt-4 space-y-1">
          {movimenti.map((m) => (
            <li key={m.id} className="text-white/80">
              {m.descrizione} — {fmtEur(m.importo)} — {fmtDate(m.data)}
            </li>
          ))}
        </ul>
      </section>

           {/* SEZIONE RICEVUTE */}
      <section className="bg-white/10 p-4 rounded-lg mt-6">
        <h2 className="text-xl font-bold text-white">Ricevute</h2>

        <div className="mt-2 space-y-2">
          <input
            type="number"
            placeholder="Importo"
            value={formRicevuta.importo}
            onChange={(e) =>
              setFormRicevuta({ ...formRicevuta, importo: e.target.value })
            }
            className="px-3 py-2 rounded bg-white/10 text-white w-full"
          />

          <input
            type="date"
            value={formRicevuta.data}
            onChange={(e) =>
              setFormRicevuta({ ...formRicevuta, data: e.target.value })
            }
            className="px-3 py-2 rounded bg-white/10 text-white w-full"
          />
        </div>

        <button
          onClick={addRicevuta}
          className="mt-2 px-4 py-2 bg-blue-600 rounded"
        >
          Aggiungi ricevuta
        </button>

        <ul className="mt-4 space-y-1">
          {ricevute.map((r) => (
            <li key={r.id} className="text-white/80">
              {fmtDate(r.data)} — {fmtEur(r.importo)}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
