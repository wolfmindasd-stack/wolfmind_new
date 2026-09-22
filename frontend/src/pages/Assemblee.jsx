import React, { useState, useEffect } from "react";
import { api, fmtDate } from "../lib/api";

export default function Assemblee() {
  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [form, setForm] = useState({
    tipo: "",
    data: "",
    luogo: "",
    oggetto: "",
    stato: "aperta",
  });

  const [editForm, setEditForm] = useState({
    id: "",
    tipo: "",
    data: "",
    luogo: "",
    oggetto: "",
    stato: "aperta",
  });

  // -------------------------------
  // LOAD ASSEMBLEE
  // -------------------------------
  const load = async () => {
    const res = await api.get("/assemblee");
    setItems(res.data);
  };

  useEffect(() => {
    load();
  }, []);

  // -------------------------------
  // FILTRO
  // -------------------------------
  const filtered = items.filter((a) => {
    const s = search.toLowerCase();
    return (
      a.tipo.toLowerCase().includes(s) ||
      a.luogo.toLowerCase().includes(s) ||
      a.oggetto.to
