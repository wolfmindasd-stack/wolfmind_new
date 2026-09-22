import React, { useState, useEffect } from "react";
import { api, fmtEur } from "../lib/api";

export default function Compensi() {
  const [compensi, setCompensi] = useState([]);
  const [istruttori, setIstruttori] = useState([]);
  const [collaboratori, setCollaboratori] = useState([]);
  const [movimenti, setMovimenti] = useState([]);
  const [ricevute, setRicevute] = useState([]);

  const [form, setForm] = useState({
    persona_id: "",
    tipo_persona: "",
    descrizione: "",
    importo: "",
    data: "",
  });

  const [filtroMese, setFiltroMese] = useState("");
  const [filtroAnno, setFiltroAnno] = useState("");

  const [showModal, setShowModal] = useState(false);

  // -------------------------------
  // LOAD DATA
  // -------------------------------
  const loadCompensi = async () => {
    const res = await api.get("/compensi");
    setCompensi(res.data);
  };

  const loadIstruttori = async () => {
    const res = await api.get("/istruttori");
    setIstruttori(res.data);
  };

  const loadCollaboratori = async () => {
    const res = await api.get("/collaboratori");
    setCollaboratori(res.data);
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
    loadCompensi();
    loadIstruttori();
    loadCollaboratori();
    loadMovimenti();
    loadRicevute();
  }, []);

  // -------------------------------
  // ADD COMPENSO
  // -------------------------------
  const addCompenso = async () => {
    await api.post("/compensi", form);
    setShowModal(false);
    setForm({
      persona_id: "",
      tipo_persona: "",
      descrizione: "",
      importo: "",
      data: "",
    });
    loadCompensi();
  };

  // -------------------------------
  // DELETE COMPENSO
  // -------------------------------
  const deleteCompenso = async (id) => {
    await api.delete(`/compensi/${id}`);
    loadCompensi();
  };

  // -------------------------------
  // FILTRI
  // -------------------------------
  const compensiFiltrati = compensi.filter((c) => {
    const d = new Date(c.data);
    const mese = d.getMonth() + 1;
    const anno = d.getFullYear();

    return (
      (filtroMese ? mese === Number(filtroMese) : true) &&
      (filtroAnno ? anno === Number(filtroAnno) : true)
    );
  });

  // -------------------------------
  // RENDER
  // -------------------------------
  return (
    <div className="p-4">
      <h1 className="text-3xl font-bold mb-4">Compensi</h1>

      {/* FILTRI */}
      <div className="flex gap-4 mb-4">
        <select
          className
