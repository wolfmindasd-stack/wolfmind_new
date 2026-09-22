import React, { useState, useEffect } from "react";
import { api } from "../lib/api";

export default function Calendario() {
  const [eventi, setEventi] = useState([]);
  const [form, setForm] = useState({
    titolo: "",
    descrizione: "",
    data: "",
    ora: "",
    tipo: "",
  });

  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);

  // -------------------------------
  // LOAD EVENTI
  // -------------------------------
  const loadEventi = async () => {
    const res = await api.get("/eventi");
    setEventi(res.data);
  };

  useEffect(() => {
    loadEventi();
  }, []);

  // -------------------------------
  // ADD EVENTO
  // -------------------------------
  const addEvento = async () => {
    await api.post("/eventi", form);
    setShowModal(false);
    setForm({ titolo: "", descrizione: "", data: "", ora: "", tipo: "" });
    loadEventi();
  };

  // -------------------------------
  // DELETE EVENTO
  // -------------------------------
  const deleteEvento = async (id) => {
    await api.delete(`/eventi/${id}`);
    loadEventi();
  };

  // -------------------------------
  // RENDER CALENDARIO
  // -------------------------------
  const giorni = [...Array(31).keys()].map((i) => i + 1);

  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">Calendario</h1>

      <div className="grid grid-cols-7 gap-2">
        {giorni.map((g) => (
          <div
            key={g}
            className="border p-2 h-32 cursor-pointer hover:bg-gray-100"
            onClick={() => {
              setSelectedDate(g);
              setShowModal(true);
              setForm({ ...form, data: `2026-09-${String(g).padStart(2, "0")}` });
            }}
          >
            <div className="font-bold">{g}</div>

            {eventi
              .filter((e) => e.data.endsWith(`-${String(g).padStart(2, "0")}`))
              .map((e) => (
                <div key={e.id} className="text-sm bg-blue-200 p-1 mt-1 rounded">
                  {e.titolo}
                </div>
              ))}
          </div>
        ))}
      </div>

      {/* MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
          <div className="bg-white p-6 rounded shadow-lg w-96">
            <h2 className="text-xl font-bold mb-4">Nuovo Evento</h2>

            <input
              className="border p-2 w-full mb-2"
              placeholder="Titolo"
              value={form.titolo}
              onChange={(e) => setForm({ ...form, titolo: e.target.value })}
            />

            <textarea
              className="border p-2 w-full mb-2"
              placeholder="Descrizione"
              value={form.descrizione}
              onChange={(e) => setForm({ ...form, descrizione: e.target.value })}
            />

            <input
              type="time"
              className="border p-2 w-full mb-2"
              value={form.ora}
              onChange={(e) => setForm({ ...form, ora: e.target.value })}
            />

            <select
              className="border p-2 w-full mb-2"
              value={form.tipo}
              onChange={(e) => setForm({ ...form, tipo: e.target.value })}
            >
              <option value="">Tipo evento</option>
              <option value="lezione">Lezione</option>
              <option value="riunione">Riunione</option>
              <option value="gara">Gara</option>
              <option value="altro">Altro</option>
            </select>

            <div className="flex justify-between mt-4">
              <button
                className="bg-gray-400 text-white px-4 py-2 rounded"
                onClick={() => setShowModal(false)}
              >
                Annulla
              </button>

              <button
                className="bg-blue-600 text-white px-4 py-2 rounded"
                onClick={addEvento}
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
