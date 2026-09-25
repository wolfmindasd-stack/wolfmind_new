import React, { useState, useEffect } from "react";
import { api } from "../lib/api";

export default function LibroSoci() {
  const [soci, setSoci] = useState([]);
  const [quote, setQuote] = useState([]);
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroStato, setFiltroStato] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [formQuota, setFormQuota] = useState({
    socio_id: "",
    importo: "",
    data: "",
  });

  const loadData = async () => {
    try {
      const [resSoci, resQuote] = await Promise.all([
        api.get("/soci"),
        api.get("/quote"),
      ]);
      setSoci(resSoci.data);
      setQuote(resQuote.data);
    } catch (error) {
      console.error("Errore nel caricamento dei dati:", error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const isSocioInRegola = (socioId) => {
    return quote.some((q) => Number(q.socio_id) === Number(socioId));
  };

  const sociFiltrati = soci.filter((s) => {
    const corrispondeNome = filtroNome
      ? `${s.nome} ${s.cognome}`.toLowerCase().includes(filtroNome.toLowerCase())
      : true;

    const inRegola = isSocioInRegola(s.id);
    const corrispondeStato =
      filtroStato === "in_regola"
        ? inRegola
        : filtroStato === "non_in_regola"
        ? !inRegola
        : true;

    return corrispondeNome && corrispondeStato;
  });

  const addQuota = async () => {
    if (!formQuota.socio_id || !formQuota.importo || !formQuota.data) {
      alert("Compila tutti i campi prima di salvare.");
      return;
    }

    try {
      await api.post("/quote", {
        socio_id: Number(formQuota.socio_id),
        importo: Number(formQuota.importo),
        data: formQuota.data,
      });

      setShowModal(false);
      setFormQuota({ socio_id: "", importo: "", data: "" });
      loadData();
    } catch (error) {
      console.error("Errore durante il salvataggio della quota:", error);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-white">Libro Soci</h1>

      <div className="flex gap-4">
        <input
          type="text"
          placeholder="Cerca per nome o cognome…"
          value={filtroNome}
          onChange={(e) => setFiltroNome(e.target.value)}
          className="px-4 py-2 rounded bg-white/10 text-white placeholder-white/50"
        />

        <select
          value={filtroStato}
          onChange={(e) => setFiltroStato(e.target.value)}
          className="px-4 py-2 rounded bg-white/10 text-white [&>option]:text-black"
        >
          <option value="">Tutti</option>
          <option value="in_regola">In regola</option>
          <option value="non_in_regola">Non in regola</option>
        </select>
      </div>

      <div className="space-y-2">
        {sociFiltrati.map((s) => {
          const inRegola = isSocioInRegola(s.id);
          return (
            <div
              key={s.id}
              className="p-4 bg-white/10 rounded-lg hover:bg-white/20 transition flex justify-between items-center"
            >
              <div>
                <div className="font-medium text-white">
                  {s.nome} {s.cognome}
                </div>
                <div className="text-sm text-white/60">{s.email}</div>

                <div className="text-xs text-white/70 mt-1">
                  {inRegola ? "🟢 In regola" : "🔴 Non in regola"}
                </div>
              </div>

              <button
                className="px-3 py-1 bg-blue-600 text-white rounded text-xs hover:bg-blue-500 transition"
                onClick={() => {
                  setFormQuota({ ...formQuota, socio_id: s.id });
                  setShowModal(true);
                }}
              >
                Aggiungi quota
              </button>
            </div>
          );
        })}
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded w-80 space-y-4 text-gray-900">
            <h2 className="text-xl font-bold">Aggiungi quota</h2>

            <select
              className="border p-2 w-full rounded"
              value={formQuota.socio_id}
              onChange={(e) =>
                setFormQuota({ ...formQuota, socio_id: e.target.value })
              }
            >
              <option value="">Seleziona socio</option>
              {soci.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.nome} {s.cognome}
                </option>
              ))}
            </select>

            <input
              type="number"
              className="border p-2 w-full rounded"
              placeholder="Importo"
              value={formQuota.importo}
              onChange={(e) =>
                setFormQuota({ ...formQuota, importo: e.target.value })
              }
            />

            <input
              type="date"
              className="border p-2 w-full rounded"
              value={formQuota.data}
              onChange={(e) =>
                setFormQuota({ ...formQuota, data: e.target.value })
              }
            />

            <div className="flex justify-end gap-2">
              <button
                className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition"
                onClick={() => setShowModal(false)}
              >
                Annulla
              </button>

              <button
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-500 transition"
                onClick={addQuota}
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
