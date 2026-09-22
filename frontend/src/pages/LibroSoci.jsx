import React, { useState, useEffect } from "react";
import { api } from "../lib/api";

export default function LibroSoci() {
  const [soci, setSoci] = useState([]);
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroStato, setFiltroStato] = useState("");

  const [quote, setQuote] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [formQuota, setFormQuota] = useState({
    socio_id: "",
    importo: "",
    data: "",
  });

  // -------------------------------
  // LOAD SOCI
  // -------------------------------
  const loadSoci = async () => {
    const res = await api.get("/soci");
    setSoci(res.data);
  };

  // -------------------------------
  // LOAD QUOTE
  // -------------------------------
  const loadQuote = async () => {
    const res = await api.get("/quote");
    setQuote(res.data);
  };

  useEffect(() => {
    loadSoci();
    loadQuote();
  }, []);

  // -------------------------------
  // FILTRI
  // -------------------------------
  const sociFiltrati = soci.filter((s) => {
    return (
      (filtroNome ? s.nome.toLowerCase().includes(filtroNome.toLowerCase()) : true) &&
      (filtroStato ? s.stato === filtroStato : true)
    );
  });

  // -------------------------------
  // ADD QUOTA
  // -------------------------------
  const addQuota = async () => {
    await api.post("/quote", formQuota);
    setShowModal(false);
    setFormQuota({ socio_id: "", importo: "", data: "" });
    loadQuote();
