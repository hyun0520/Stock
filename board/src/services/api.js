import axios from "axios";

const API_BASE = import.meta.env.PROD
  ? import.meta.env.VITE_API_URL + "/api"
  : "http://localhost:5000/api";

export const api = axios.create({
  baseURL: API_BASE,
  withCredentials: false, // JWT header 방식이면 false
});
