// frontend/src/lib/api.js
import axios from "axios";

// Cloudflare Pages NON passa sempre REACT_APP_BACKEND_URL.
// Quindi usiamo fallback automatico.
const BACKEND_URL =
  process.env.REACT_APP_BACKEND_URL || "https://wolfmind-new.onrender.com";

export const API = `${BACKEND_URL}/api`;

export const api = axios.create({
  baseURL: API,
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
