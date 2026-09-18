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
