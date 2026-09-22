import React, { useState, useEffect } from "react";
import { api } from "../lib/api";

export default function Impostazioni() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const [form, setForm] = useState({
    nome_associazione: "",
    email: "",
    telefono: "",
    indirizzo: "",
    sede_legale: "",
    sede_operativa: "",
    iban: "",
    logo: null,
  });

  const [showModal, setShowModal] = useState(false);

  // -------------------------------
  // LOAD IMPOSTAZIONI
  // -------------------------------
  const load = async () => {
    const res = await api.get("/impostazioni");
    setData(res.data);

    setForm({
      nome_associazione: res.data.nome_associazione || "",
      email: res.data.email || "",
      telefono: res.data.telefono || "",
