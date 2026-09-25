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

  // -------------------------------
  // LOAD DATA (In parallelo)
  // -------------------------------
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
    const loadAllData = async () => {
      try {
        await Promise.all([
          loadTipi(),
          loadTesserati(),
          loadSoci(),
          loadPacchetti(),
          loadMovimenti(),
          loadRicevute(),
        ]);
      } catch (error) {
        console.error("Errore nel caricamento dei dati iniziali:", error);
      }
    };

    loadAllData();
  }, []);

  // -------------------------------
  // ADD ACTIONS
  // -------------------------------
  const addTipo = async () => {
    if (!formTipo.nome.trim()) return alert("Inserisci un nome tipo.");
    try {
      await api.post("/tipi", formTipo);
      setFormTipo({ nome: "" });
      loadTipi();
    } catch (err) {
      console.error("Errore aggiunta tipo:", err);
    }
  };

  const addTesserato = async () => {
    if (!formTesserato.nome.trim() || !formTesserato.cognome.trim()) {
      return alert("Compila nome e cognome tesserato.");
    }
    try {
      await api.post("/tesserati", formTesserato);
      setFormTesserato({ nome: "", cognome: "", email: "" });
      loadTesserati();
    } catch (err) {
      console.error("Errore aggiunta tesserato:", err);
    }
  };

  const addSocio = async () => {
    if (!formSocio.nome.trim() || !formSocio.cognome.trim()) {
      return alert("Compila nome e cognome socio.");
    }
    try {
      await api.post("/soci", formSocio);
      setFormSocio({ nome: "", cognome: "", email: "" });
      loadSoci();
    } catch (err) {
      console.error("Errore aggiunta socio:", err);
    }
  };

  const addPacchetto = async () => {
    if (!formPacchetto.nome.trim() || !formPacchetto.prezzo) {
      return alert("Compila nome e prezzo del pacchetto.");
    }
    try {
      await api.post("/pacchetti", {
        ...formPacchetto,
        prezzo: Number(formPacchetto.prezzo),
      });
      setFormPacchetto({ nome: "", prezzo: "" });
      loadPacchetti();
    } catch (err) {
      console.error("Errore aggiunta pacchetto:", err);
    }
  };

  const addMovimento = async () => {
    if (!formMovimento.descrizione.trim() || !formMovimento.importo || !formMovimento.data) {
      return alert("Compila tutti i campi del movimento.");
    }
    try {
      await api.post("/movimenti", {
        ...formMovimento,
        importo: Number(formMovimento.importo),
      });
      setFormMovimento({ descrizione: "", importo: "", data: "" });
      loadMovimenti();
    } catch (err) {
      console.error("Errore aggiunta movimento:", err);
    }
  };

  const addRicevuta = async () => {
    if (!formRicevuta.importo || !formRicevuta.data) {
      return alert("Compila tutti i campi della ricevuta.");
    }
    try {
      await api.post("/ricevute", {
        ...formRicevuta,
        persona_id: formRicevuta.persona_id ? Number(formRicevuta.persona_id) : null,
        importo: Number(formRicevuta.importo),
      });
      setFormRicevuta({ persona_id: "", importo: "", data: "" });
      loadRicevute();
    } catch (err) {
      console.error("Errore aggiunta ricevuta:", err);
    }
  };

  // -------------------------------
  // RENDER
  // -------------------------------
  return (
    <div className="space-y-10 text-white p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold">Pannello Admin</h1>

      {/* TIPI */}
      <section className="bg-white/10 p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Tipi</h2>

        <input
          type="text"
          className="border border-white/20 p-2 rounded w-full bg-white/10 text-white placeholder-white/50"
          placeholder="Nome tipo"
          value={formTipo.nome}
          onChange={(e) => setFormTipo({ nome: e.target.value })}
        />

        <button
          onClick={addTipo}
          className="mt-2 px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 transition"
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

        <div className="space-y-2">
          <input
            type="text"
            className="border border-white/20 p-2 rounded w-full bg-white/10 text-white placeholder-white/50"
            placeholder="Nome"
            value={formTesserato.nome}
            onChange={(e) =>
              setFormTesserato({ ...formTesserato, nome: e.target.value })
            }
          />

          <input
            type="text"
            className="border border-white/20 p-2 rounded w-full bg-white/10 text-white placeholder-white/50"
            placeholder="Cognome"
            value={formTesserato.cognome}
            onChange={(e) =>
              setFormTesserato({ ...formTesserato, cognome: e.target.value })
            }
          />

          <input
            type="email"
            className="border border-white/20 p-2 rounded w-full bg-white/10 text-white placeholder-white/50"
            placeholder="Email"
            value={formTesserato.email}
            onChange={(e) =>
              setFormTesserato({ ...formTesserato, email: e.target.value })
            }
          />
        </div>

        <button
          onClick={addTesserato}
          className="mt-2 px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 transition"
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

        <div className="space-y-2">
          <input
            type="text"
            className="border border-white/20 p-2 rounded w-full bg-white/10 text-white placeholder-white/50"
            placeholder="Nome"
            value={formSocio.nome}
            onChange={(e) =>
              setFormSocio({ ...formSocio, nome: e.target.value })
            }
          />

          <input
            type="text"
            className="border border-white/20 p-2 rounded w-full bg-white/10 text-white placeholder-white/50"
            placeholder="Cognome"
            value={formSocio.cognome}
            onChange={(e) =>
              setFormSocio({ ...formSocio, cognome: e.target.value })
            }
          />

          <input
            type="email"
            className="border border-white/20 p-2 rounded w-full bg-white/10 text-white placeholder-white/50"
            placeholder="Email"
            value={formSocio.email}
            onChange={(e) =>
              setFormSocio({ ...formSocio, email: e.target.value })
            }
          />
        </div>

        <button
          onClick={addSocio}
          className="mt-2 px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 transition"
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

        <div className="space-y-2">
          <input
            type="text"
            className="border border-white/20 p-2 rounded w-full bg-white/10 text-white placeholder-white/50"
            placeholder="Nome pacchetto"
            value={formPacchetto.nome}
            onChange={(e) =>
              setFormPacchetto({ ...formPacchetto, nome: e.target.value })
            }
          />

          <input
            type="number"
            className="border border-white/20 p-2 rounded w-full bg-white/10 text-white placeholder-white/50"
            placeholder="Prezzo (€)"
            value={formPacchetto.prezzo}
            onChange={(e) =>
              setFormPacchetto({ ...formPacchetto, prezzo: e.target.value })
            }
          />
        </div>

        <button
          onClick={addPacchetto}
          className="mt-2 px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 transition"
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

        <div className="space-y-2">
          <input
            type="text"
            className="border border-white/20 p-2 rounded w-full bg-white/10 text-white placeholder-white/50"
            placeholder="Descrizione"
            value={formMovimento.descrizione}
            onChange={(e) =>
              setFormMovimento({ ...formMovimento, descrizione: e.target.value })
            }
          />

          <input
            type="number"
            className="border border-white/20 p-2 rounded w-full bg-white/10 text-white placeholder-white/50"
            placeholder="Importo (€)"
            value={formMovimento.importo}
            onChange={(e) =>
              setFormMovimento({ ...formMovimento, importo: e.target.value })
            }
          />

          <input
            type="date"
            className="border border-white/20 p-2 rounded w-full bg-white/10 text-white"
            value={formMovimento.data}
            onChange={(e) =>
              setFormMovimento({ ...formMovimento, data: e.target.value })
            }
          />
        </div>

        <button
          onClick={addMovimento}
          className="mt-2 px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 transition"
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
      <section className="bg-white/10 p-4 rounded-lg">
        <h2 className="text-xl font-bold mb-2">Ricevute</h2>

        <div className="space-y-2">
          {/* Seleziona Persona (Socio o Tesserato) */}
          <select
            value={formRicevuta.persona_id}
            onChange={(e) =>
              setFormRicevuta({ ...formRicevuta, persona_id: e.target.value })
            }
            className="p-2 rounded bg-white/10 text-white w-full border border-white/20 [&>option]:text-black"
          >
            <option value="">Seleziona Intestatario (Opzionale)</option>
            <optgroup label="Soci">
              {soci.map((s) => (
                <option key={`socio-${s.id}`} value={s.id}>
                  {s.nome} {s.cognome} (Socio)
                </option>
              ))}
            </optgroup>
            <optgroup label="Tesserati">
              {tesserati.map((t) => (
                <option key={`tess-${t.id}`} value={t.id}>
                  {t.nome} {t.cognome} (Tesserato)
                </option>
              ))}
            </optgroup>
          </select>

          <input
            type="number"
            placeholder="Importo (€)"
            value={formRicevuta.importo}
            onChange={(e) =>
              setFormRicevuta({ ...formRicevuta, importo: e.target.value })
            }
            className="p-2 rounded bg-white/10 text-white placeholder-white/50 w-full border border-white/20"
          />

          <input
            type="date"
            value={formRicevuta.data}
            onChange={(e) =>
              setFormRicevuta({ ...formRicevuta, data: e.target.value })
            }
            className="p-2 rounded bg-white/10 text-white w-full border border-white/20"
          />
        </div>

        <button
          onClick={addRicevuta}
          className="mt-2 px-4 py-2 bg-blue-600 rounded hover:bg-blue-500 transition"
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
