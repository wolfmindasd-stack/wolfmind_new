import React, { useState, useEffect } from "react";
import { api, fmtEur, fmtDate } from "../lib/api";

export default function Quote() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [anno, setAnno] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    socio_id: "",
    anno: "",
    importo: "",
  });

  // -------------------------------
  // LOAD QUOTE
  // -------------------------------
  const load = async () => {
    const res = await api.get("/quote");
    setItems(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  // -------------------------------
  // FILTRI
  // -------------------------------
  const filtrate = items.filter((q) => {
    const s = search.toLowerCase();
    const okSearch =
      q.socio_nome.to
