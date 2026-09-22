import React, { useState, useEffect } from "react";
import { api, fmtDate } from "../lib/api";

export default function Documenti() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [categoria, setCategoria] = useState("");

  const [showModal, setShowModal] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    categoria: "",
    file: null,
  });

  // -------------------------------
  // LOAD DOCUMENTI
  // -------------------------------
  const load = async () => {
    const res = await api.get("/documenti");
    setItems(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  // -------------------------------
  // FILTRI
  // -------------------------------
  const filtrati = items.filter((d) => {
    const s = search.toLowerCase();
    const okSearch =
      d.nome.toLowerCase().includes(s) ||
      d.categoria.toLowerCase().includes(s);

    const okCat = categoria ? d.categoria === categoria : true;

    return okSearch && okCat;
  });

  // -------------------------------
  // UPLOAD DOCUMENTO
  // -------------------------------
  const upload = async () => {
    const fd = new FormData();
    fd.append("nome", form.nome);
    fd.append("categoria", form.categoria);
    fd.append("file", form.file);

    await api.post("/documenti", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    setShowModal(false);
    setForm({ nome: "", categoria: "", file: null });
    load();
  };

  // -------------------------------
