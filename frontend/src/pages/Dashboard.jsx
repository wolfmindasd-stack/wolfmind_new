import React, { useEffect, useState } from "react";
import { api } from "../lib/api";
import { Link } from "react-router-dom";

export default function Dashboard() {
  // Recupera l'utente salvato dal login
  const saved = localStorage.getItem("user");
  const user = saved ? JSON.parse(saved) : null;

  const [scadenze, setScadenze] = useState([]);
  const [caricamento, setCaricamento] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await api.get("/dashboard");
        setScadenze(res.data.scadenze_imminenti || []);
      } catch (err) {
        console.error("Errore nel caricamento dashboard:", err);
      }
      setCaricamento(false);
    };

    fetchData();
  }, []);

  if (!user) {
    return (
      <div className="p-6 text-center text-xl">
        Caricamento dati utente...
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-3xl font-bold">
        Benvenuto {user.nome}
      </h1>

      <div className="text-lg">
        Ruolo: <strong>{user.ruolo}</strong>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Link
          to="/calendario"
          className="p-6 bg-blue-600 text-white rounded-lg shadow hover:bg-blue-700 transition"
        >
          <h2 className="text-xl font-bold">Calendario Lezioni</h2>
          <p>Crea le tue lezioni. Ricorrenza settimanale disponibile.</p>
        </Link>

        <Link
          to="/compensi"
          className="p-6 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition"
        >
          <h2 className="text-xl font-bold">Compensi</h2>
          <p>Gestione compensi e ricevute.</p>
        </Link>

        <Link
          to="/movimenti"
          className="p-6 bg-purple-600 text-white rounded-lg shadow hover:bg-purple-700 transition"
        >
          <h2 className="text-xl font-bold">Movimenti</h2>
          <p>Rendicontazione economica.</p>
        </Link>

        <Link
          to="/libro-soci"
          className="p-6 bg-orange-600 text-white rounded-lg shadow hover:bg-orange-700 transition"
        >
          <h2 className="text-xl font-bold">Libro Soci</h2>
          <p>Gestione iscritti e storico.</p>
        </Link>

        <Link
          to="/abbonamenti"
          className="p-6 bg-red-600 text-white rounded-lg shadow hover:bg-red-700 transition"
        >
          <h2 className="text-xl font-bold">Abbonamenti</h2>
          <p>Gestione piani e scadenze.</p>
        </Link>

        <Link
          to="/profilo"
          className="p-6 bg-gray-700 text-white rounded-lg shadow hover:bg-gray-800 transition"
        >
          <h2 className="text-xl font-bold">Profilo</h2>
          <p>Modifica dati personali.</p>
        </Link>
      </div>

      <div className="mt-10">
        <h2 className="text-2xl font-bold mb-4">Scadenze Imminenti</h2>

        {caricamento ? (
          <div>Caricamento...</div>
        ) : scadenze.length === 0 ? (
          <div>Nessuna scadenza imminente.</div>
        ) : (
          <ul className="space-y-2">
            {scadenze.map((s, i) => (
              <li key={i} className="p-4 bg-white rounded shadow">
                <strong>{s.nome}</strong> — {s.data}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
