import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import api from "../api";
import { useAuth } from "../auth";
import { fmtDate } from "../utils";

export default function Tesserati() {
  const { user } = useAuth();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    api
      .get("/api/tesserati")   // <── CORRETTO
      .then((r) => {
        setItems(r.data);
        setFiltered(r.data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    const s = search.toLowerCase();
    setFiltered(
      items.filter(
        (t) =>
          t.nome.toLowerCase().includes(s) ||
          t.cognome.toLowerCase().includes(s) ||
          t.email?.toLowerCase().includes(s)
      )
    );
  }, [search, items]);

  if (loading) {
    return <div className="text-white/50">Caricamento…</div>;
  }

  return (
    <div className="space-y-6" data-testid="tesserati-page">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-white">Tesserati</h1>
        <Link
          to="/tesserati/nuovo"
          className="px-4 py-2 bg-[#007AFF] text-white rounded-lg text-sm"
        >
          Nuovo tesserato
        </Link>
      </div>

      <input
        type="text"
        placeholder="Cerca…"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full px-4 py-2 rounded-lg bg-white/10 text-white"
      />

      <div className="space-y-2">
        {filtered.map((t) => (
          <Link
            key={t.id}
            to={`/tesserati/${t.id}`}
            className="block p-4 bg-white/10 rounded-lg hover:bg-white/20 transition"
          >
            <div className="font-medium text-white">
              {t.cognome} {t.nome}
            </div>
            <div className="text-xs text-white/50">
              {t.email} · {t.telefono}
            </div>
            <div className="text-xs text-white/50">
              Tesseramento: {fmtDate(t.scadenza_tesseramento)}
              {" · "}
              Visita: {fmtDate(t.scadenza_visita_medica)}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
