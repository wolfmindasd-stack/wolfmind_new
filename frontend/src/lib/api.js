// frontend/src/lib/api.js
import axios from "axios";

const API_URL =
  process.env.REACT_APP_API_URL || "https://wolfmind-new.onrender.com/api";

export const api = axios.create({
  baseURL: API_URL,
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const API = API_URL; // ✅ aggiunto

export function fmtEur(value) {
  return new Intl.NumberFormat("it-IT", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value ?? 0);
}

export function fmtDate(value) {
  if (!value) return "";
  return new Intl.DateTimeFormat("it-IT").format(new Date(value));
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

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
