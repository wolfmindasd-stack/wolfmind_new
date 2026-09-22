import React, { useState, useEffect } from "react";
import { api } from "../lib/api";

export default function Soci() {
  const [soci, setSoci] = useState([]);
  const [filtroNome, setFiltroNome] = useState("");
  const [filtroStato, setFiltroStato] = useState("");

  const [showModal, setShowModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    cognome: "",
    email: "",
    telefono: "",
    stato: "attivo",
  });

  const [editForm, setEditForm] = useState({
    id: "",
    nome: "",
    cognome: "",
    email: "",
    telefono: "",
    stato: "attivo",
  });

  // -------------------------------
  // LOAD SOCI
  // -------------------------------
  const loadSoci = async () => {
    const res = await api.get("/soci");
