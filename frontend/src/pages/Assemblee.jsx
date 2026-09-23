import React, { useState, useEffect } from "react";
import { api, fmtDate } from "../lib/api";

export default function Assemblee() {
  const [items, setItems] = useState([]);
  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    titolo: "",
    data: "",
    luogo: "",
    stato: "aperta",
  });

  // -------------------------------
  // LOAD
  // -------------------------------
  const load = async () => {
    const r = await api.get("/assemblee");
    setItems(r.data);
  };

  useEffect(() => {
    load();
  }, []);

  // -------------------------------
  // SAVE
  // -------------------------------
  const save = async () => {
    await api.post("/assemblee", form);
    setShowModal(false);
    setForm({ titolo: "", data: "", luogo: "", stato: "aperta" });
    load();
  };

  // -------------------------------
  // DELETE
  // -------------------------------
  const del = async (id) => {
    await api.delete(`/assemblee/${id}`);
    load();
  };

  // -------------------------------
  // RENDER
  // -------------------------------
  return (
    <div className="space-y-6 text-white">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Assemblee</h1>

        <button
          onClick={() => setShowModal(true)}
          className="px-4 py-2 bg-blue-600 rounded"
        >
          Nuova assemblea
        </button>
      </div>

      {/* LISTA */}
      <div className="space-y-2">
        {items.map((a) => (
          <div
            key={a.id}
            className="p-4 bg-white/10 rounded-lg flex justify-between"
          >
            <div>
              <div className="font-semibold">{a.titolo}</div>
              <div className="text-sm text-white/60">
                {fmtDate(a.data)} — {a.luogo}
              </div>
              <div className="text-xs text-white/50">
                Stato: {a.stato}
              </div>
            </div>

            <button
              onClick={() => del(a.id)}
              className="px-3 py-1 bg-red-600 rounded"
            >
              Elimina
            </button>
          </div>
        ))}
      </div>

      {/* MODALE */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white text-black p-6 rounded w-80 space-y-4">
            <h2 className="text-xl font-bold">Nuova assemblea</h2>

            <input
              type="text"
              placeholder="Titolo"
              className="border p-2 w-full rounded"
              value={form.titolo}
              onChange={(e) =>
                setForm({ ...form, titolo: e.target.value })
              }
            />

            <input
              type="date"
              className="border p-2 w-full rounded"
              value={form.data}
              onChange={(e) =>
                setForm({ ...form, data: e.target.value })
              }
            />

            <input
              type="text"
              placeholder="Luogo"
              className="border p-2 w-full rounded"
              value={form.luogo}
              onChange={(e) =>
                setForm({ ...form, luogo: e.target.value })
              }
            />

            <select
              className="border p-2 w-full rounded"
              value={form.stato}
              onChange={(e) =>
                setForm({ ...form, stato: e.target.value })
              }
            >
              <option value="aperta">Aperta</option>
              <option value="chiusa">Chiusa</option>
            </select>

            <button
              onClick={save}
              className="w-full bg-blue-600 text-white p-2 rounded"
            >
              Salva
            </button>

            <button
              onClick={() => setShowModal(false)}
              className="w-full bg-gray-300 p-2 rounded"
            >
              Annulla
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
