import React, { useState, useEffect } from "react";
import { api, fmtEur, fmtDate } from "../lib/api";

export default function Bilancio() {
  const [movimenti, setMovimenti] = useState([]);
  const [loading, setLoading] = useState(true);

  // -------------------------------
  // LOAD
  // -------------------------------
  const load = async () => {
    const r = await api.get("/movimenti");
    setMovimenti(r.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  if (loading) {
    return <div className="text-white">Caricamento…</div>;
  }

  // -------------------------------
  // CALCOLI
  // -------------------------------
  const entrate = movimenti
    .filter((m) => m.importo > 0)
    .reduce((sum, m) => sum + m.importo, 0);

  const uscite = movimenti
    .filter((m) => m.importo < 0)
    .reduce((sum, m) => sum + m.importo, 0);

  const saldo = entrate + uscite;

  // -------------------------------
  // RENDER
  // -------------------------------
  return (
    <div className="space-y-6 text-white">
      <h1 className="text-2xl font-bold">Bilancio</h1>

      {/* RIASSUNTO */}
      <div className="grid grid-cols-3 gap-4">
        <div className="p-4 bg-white/10 rounded-lg">
          <div className="text-sm text-white/60">Entrate</div>
          <div className="text-xl font-bold text-green-400">
            {fmtEur(entrate)}
          </div>
        </div>

        <div className="p-4 bg-white/10 rounded-lg">
          <div className="text-sm text-white/60">Uscite</div>
          <div className="text-xl font-bold text-red-400">
            {fmtEur(uscite)}
          </div>
        </div>

        <div className="p-4 bg-white/10 rounded-lg">
          <div className="text-sm text-white/60">Saldo</div>
          <div
            className={`text-xl font-bold ${
              saldo >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {fmtEur(saldo)}
          </div>
        </div>
      </div>

      {/* TABELLA MOVIMENTI */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Movimenti</h2>

        {movimenti.map((m) => (
          <div
            key={m.id}
            className="p-4 bg-white/10 rounded-lg flex justify-between"
          >
            <div>
              <div className="font-semibold">{m.descrizione}</div>
              <div className="text-sm text-white/60">
                {fmtDate(m.data)}
              </div>
            </div>

            <div
              className={`font-bold ${
                m.importo >= 0 ? "text-green-400" : "text-red-400"
              }`}
            >
              {fmtEur(m.importo)}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
