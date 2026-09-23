import React, { useState, useEffect } from "react";
import { api } from "../lib/api";

export default function Documenti() {
  const [items, setItems] = useState([]);
  const [file, setFile] = useState(null);
  const [categoria, setCategoria] = useState("");
  const [loading, setLoading] = useState(true);

  // -------------------------------
  // LOAD
  // -------------------------------
  const load = async () => {
    const r = await api.get("/documenti");
    setItems(r.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // -------------------------------
  // UPLOAD
  // -------------------------------
  const upload = async () => {
    if (!file) {
      alert("Seleziona un file");
      return;
    }

    const fd = new FormData();
    fd.append("file", file);
    fd.append("categoria", categoria);

    await api.post("/documenti", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    setFile(null);
    setCategoria("");
    load();
  };

  // -------------------------------
  // DELETE
  // -------------------------------
  const del = async (id) => {
    await api.delete(`/documenti/${id}`);
    load();
  };

  if (loading) {
    return <div className="text-white">Caricamento…</div>;
  }

  // -------------------------------
  // RENDER
  // -------------------------------
  return (
    <div className="space-y-6 text-white">
      <h1 className="text-2xl font-bold">Documenti</h1>

      {/* UPLOAD */}
      <div className="bg-white/10 p-4 rounded-lg space-y-4">
        <h2 className="text-xl font-bold">Carica documento</h2>

        <select
          className="border p-2 rounded w-full bg-white/20 text-white"
          value={categoria}
          onChange={(e) => setCategoria(e.target.value)}
        >
          <option value="">Seleziona categoria</option>
          <option value="verbali">Verbali</option>
          <option value="bilanci">Bilanci</option>
          <option value="certificati">Certificati</option>
          <option value="privacy">Privacy</option>
          <option value="contratti">Contratti</option>
        </select>

        <input
          type="file"
          className="text-sm"
          onChange={(e) => setFile(e.target.files[0])}
        />

        <button
          onClick={upload}
          className="px-4 py-2 bg-blue-600 rounded"
        >
          Carica
        </button>
      </div>

      {/* LISTA DOCUMENTI */}
      <div className="space-y-2">
        <h2 className="text-xl font-bold">Archivio documenti</h2>

        {items.map((d) => (
          <div
            key={d.id}
            className="p-4 bg-white/10 rounded-lg flex justify-between items-center"
          >
            <div>
              <div className="font-semibold">{d.nome}</div>
              <div className="text-sm text-white/60">
                Categoria: {d.categoria}
              </div>
            </div>

            <div className="flex gap-2">
              <a
                href={d.url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-3 py-1 bg-green-600 rounded"
              >
                Apri
              </a>

              <button
                onClick={() => del(d.id)}
                className="px-3 py-1 bg-red-600 rounded"
              >
                Elimina
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
