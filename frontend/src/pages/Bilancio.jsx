import React, { useState, useEffect } from "react";
import { api, fmtEur, fmtDate } from "../lib/api";

export default function Bilancio() {
  const [movimenti, setMovimenti] = useState([]);
  const [filtro, setFiltro] = useState({
    da: "",
    a: "",
  });

  const [totali, setTotali] = useState({
    entrate: 0,
    uscite: 0,
    saldo: 0,
  });

  // -------------------------------
  // LOAD MOVIMENTI
  // -------------------------------
  const load = async () => {
    const res = await api.get("/movimenti");
    setMovimenti(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  // -------------------------------
  // FILTRI
  // -------------------------------
  const filtrati = movimenti.filter((m) => {
    const d = new Date(m.data);

    const okDa = filtro.da ? d >= new Date(filtro.da) : true;
    const okA = filtro.a ? d <= new Date(filtro.a) : true;

    return okDa && okA;
  });

  // -------------------------------
  // CALCOLI
  // -------------------------------
  useEffect(() => {
    let entrate = 0;
    let uscite = 0;

    filtrati.forEach((m) => {
      if (m.tipo === "entrata") entrate += m.importo;
      else uscite += m.importo;
    });

    setTotali({
      entr
