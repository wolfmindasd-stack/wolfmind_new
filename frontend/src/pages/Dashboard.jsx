import React, { useState, useEffect } from "react";
import { api, fmtEur } from "../lib/api";

export default function Dashboard() {
  const [tesserati, setTesserati] = useState([]);
  const [soci, setSoci] = useState([]);
  const [pacchetti, setPacchetti] = useState([]);
  const [movimenti, setMovimenti] = useState([]);
  const [ricevute, setRicevute] = useState([]);

  // -------------------------------
  // LOAD DATA
  // -------------------------------
  const loadTesserati = async () => {
    const res = await api.get("/tesserati");
    setTesserati(res.data);
  };

  const loadSoci = async () => {
    const res = await api.get("/soci");
    setSoci(res.data);
  };

  const loadPacchetti = async () => {
    const res = await api.get("/pacchetti");
    setPacchetti(res.data);
  };

  const loadMovimenti = async () => {
    const res = await api.get("/movimenti");
    setMovimenti(res.data);
  };

  const loadRicevute = async () => {
    const res = await api.get("/ricevute");
    setRicevute(res.data);
  };

  useEffect(() => {
    loadTesserati();
    loadSoci();
    loadPacchetti();
    loadMovimenti();
    loadRicevute();
  }, []);

  // -------------------------------
  // RENDER
  // -------------------------------
  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-2">Tesserati</h2>
          <p className="text-4xl font-bold">{tesserati.length}</p>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-2">Soci</h2>
          <p className="text-4xl font-bold">{soci.length}</p>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-2">Pacchetti</h2>
          <p className="text-4xl font-bold">{pacchetti.length}</p>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-2">Movimenti</h2>
          <p className="text-4xl font-bold">{movimenti.length}</p>
        </div>

        <div className="bg-white p-6 rounded shadow">
          <h2 className="text-xl font-bold mb-2">Ricevute</h2>
          <p className="text-4xl font-bold">{ricevute.length}</p>
        </div>
      </div>
    </div>
  );
}
