import axios from "axios";

export const api = axios.create({
  baseURL: "https://wolfmind-new-backend.onrender.com/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Formattazione valuta EUR
export const fmtEur = (value) =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(value);

// Gestione errori API
export const formatApiErrorDetail = (error) => {
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  return "Errore di comunicazione con il server";
};
