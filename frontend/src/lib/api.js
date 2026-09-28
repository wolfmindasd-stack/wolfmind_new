import axios from "axios";

export const api = axios.create({
  baseURL: "https://wolfmind-new-backend.onrender.com",
  headers: {
    "Content-Type": "application/json",
  },
});

// Intercettore: Aggiunge automaticamente il token/ID a TUTTE le richieste HTTP
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Formattazione valuta EUR
export const fmtEur = (value) =>
  new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
  }).format(value || 0);

// Formattazione data it-IT (es. 28/09/2026)
export const fmtDate = (dateStr) => {
  if (!dateStr) return "";
  try {
    return new Date(dateStr).toLocaleDateString("it-IT");
  } catch (e) {
    return dateStr;
  }
};

// Data odierna in formato ISO YYYY-MM-DD
export const todayIso = () => {
  return new Date().toISOString().split("T")[0];
};

// Gestione errori API
export const formatApiErrorDetail = (error) => {
  if (error.response?.data?.detail) {
    return error.response.data.detail;
  }
  return "Errore di comunicazione con il server";
};
