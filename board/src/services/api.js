import axios from "axios";

const API_BASE = import.meta.env.PROD
  ? import.meta.env.VITE_API_URL + "/api"
  : "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false,
});

// 🔐 JWT 자동 첨부
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);
