import React, { useState, useEffect } from "react";
import { api, fmtEur } from "../lib/api";

export default function Dashboard() {
  const [tesserati, setTesserati] = useState([]);
  const [soci, setSoci] = useState([]);
  const [pacchetti, setPacchetti] = useState([]);
  const [movimenti, setMovimenti] = useState([]);
  const [ricevute, setRicevute] = useState([]);

  const [loading, setLoading] = useState(true);

  // -------------------------------
  // LOAD
  // -------------------------------
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
    Promise.all([
      loadTesserati(),
      loadSoci(),
      loadPacchetti(),
      loadMovimenti(),
      loadRicevute(),
    ]).then(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-white">Caricamento…</div>;
  }

  // -------------------------------
  // CALCOLI
  // -------------------------------
  const totaleEntrate = movimenti
    .filter((m) => m.importo > 0)
    .reduce((sum, m) => sum + m.importo, 0);

  const totaleUscite = movimenti
    .filter((m) => m.importo < 0)
    .reduce((sum, m) => sum + m.importo, 0);

  const saldo = totaleEntrate + totaleUscite;

  // -------------------------------
  // RENDER
  // -------------------------------
  return (
    <div className="space-y-6 text-white">
      <h1 className="text-3xl font-bold">Dashboard</h1>

      {/* CARDS */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white/10 rounded-lg">
          <div className="text-sm text-white/60">Tesserati</div>
          <div className="text-2xl font-bold">{tesserati.length}</div>
        </div>

        <div className="p-4 bg-white/10 rounded-lg">
          <div className="text-sm text-white/60">Soci</div>
          <div className="text-2xl font-bold">{soci.length}</div>
        </div>

        <div className="p-4 bg-white/10 rounded-lg">
          <div className="text-sm text-white/60">Pacchetti</div>
          <div className="text-2xl font-bold">{pacchetti.length}</div>
        </div>
      </div>

      {/* FINANZE */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white/10 rounded-lg">
          <div className="text-sm text-white/60">Entrate</div>
          <div className="text-2xl font-bold text-green-400">
            {fmtEur(totaleEntrate)}
          </div>
        </div>

        <div className="p-4 bg-white/10 rounded-lg">
          <div className="text-sm text-white/60">Uscite</div>
          <div className="text-2xl font-bold text-red-400">
            {fmtEur(totaleUscite)}
          </div>
        </div>

        <div className="p-4 bg-white/10 rounded-lg">
          <div className="text-sm text-white/60">Saldo</div>
          <div
            className={`text-2xl font-bold ${
              saldo >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {fmtEur(saldo)}
          </div>
        </div>
      </div>

      {/* RICEVUTE */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Ultime ricevute</h2>

        {ricevute.slice(0, 5).map((r) => (
          <div
            key={r.id}
            className="p-4 bg-white/10 rounded-lg flex justify-between"
          >
            <div>
              <div className="font-semibold">{r.persona_nome}</div>
              <div className="text-sm text-white/60">{r.data}</div>
            </div>

            <div className="font-bold">{fmtEur(r.importo)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
