import React, { useState, useEffect } from "react";
import { api } from "../lib/api";

export default function Profilo() {
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  const [showEdit, setShowEdit] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const [form, setForm] = useState({
    nome: "",
    email: "",
    telefono: "",
  });

  const [passwordForm, setPasswordForm] = useState({
    attuale: "",
    nuova: "",
    conferma: "",
  });

  const [avatarFile, setAvatarFile] = useState(null);

  // -------------------------------
  // LOAD PROFILO
  // -------------------------------
  const load = async () => {
    const res = await api.get("/profilo");
    setData(res.data);

    setForm({
      nome: res.data.nome || "",
      email: res.data.email || "",
      telefono: res.data.telefono || "",
    });

    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  // -------------------------------
  // SALVA DATI PROFILO
  // -------------------------------
  const save = async () => {
    await api.patch("/profilo", form);
    setShowEdit(false);
    load();
  };

  // -------------------------------
  // CAMBIA PASSWORD
  // -------------------------------
  const changePassword = async () => {
    if (passwordForm.nuova !== passwordForm.conferma) {
      alert("Le password non coincidono");
      return;
    }

    await api.patch("/profilo/password", {
      attuale: passwordForm.attuale,
      nuova: passwordForm.nuova,
    });

    setPasswordForm({ attuale: "", nuova: "", conferma: "" });
    setShowPassword(false);
  };

  // -------------------------------
  // CAMBIA AVATAR
  // -------------------------------
  const changeAvatar = async () => {
    const fd = new FormData();
    fd.append("avatar", avatarFile);

    await api.patch("/profilo/avatar", fd, {
      headers: { "Content-Type": "multipart/form-data" },
    });

    setAvatarFile(null);
    load();
  };

  if (loading) {
    return <div className="text-white">Caricamento…</div>;
  }

  // -------------------------------
  // RENDER
  // -------------------------------
