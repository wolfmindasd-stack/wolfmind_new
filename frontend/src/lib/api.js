// frontend/src/lib/api.js
import axios from "axios";

// Usa direttamente la variabile API_URL impostata su Cloudflare
const API_URL =
  process.env.REACT_APP_API_URL || "https://wolfmind-backend-new.onrender.com/api";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

// Interceptor: aggiunge il token JWT
api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Formatta importi in euro
export function fmtEur(value) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

// Formatta date ISO → dd/mm/yyyy
export function fmtDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("it-IT").format(new Date(value));
}

// Ritorna la data di oggi in formato YYYY-MM-DD
export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

// Formatta errori API in modo leggibile
export function formatApiErrorDetail(err) {
  try {
    if (err?.response?.data?.detail) {
      return err.response.data.detail;
    }
    if (err?.message) {
      return err.message;
    }
    return "Errore sconosciuto";
  } catch {
    return "Errore sconosciuto";
  }
}
