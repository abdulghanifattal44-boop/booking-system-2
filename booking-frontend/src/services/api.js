import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api";

// Match AuthContext storage separation (customer vs admin frontends)
const APP_TARGET = import.meta.env.VITE_APP_TARGET || "customer";
const STORAGE_KEY = APP_TARGET === "admin" ? "booking_auth_admin" : "booking_auth_customer";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const data = JSON.parse(raw);
      if (data?.token) {
        config.headers = config.headers || {};
        config.headers.Authorization = `Bearer ${data.token}`;
      }
    }
  } catch {
    // ignore
  }
  return config;
});

export default api;
