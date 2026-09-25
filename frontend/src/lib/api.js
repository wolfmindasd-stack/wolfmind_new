import axios from "axios";

export const api = axios.create({
  baseURL: "https://wolfmind-new-backend.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});

// Formattazione valuta EUR
export const fmtEur = (value) =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(value || 0);

// Formattazione data (richiesta da Admin.jsx)
export const fmtDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("it-IT");
  } catch (e) {
    return dateStr;
  }
};

// Gestione errori API
export const formatApiErrorDetail = (error) => {
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  return "Errore di comunicazione con il server";
};
