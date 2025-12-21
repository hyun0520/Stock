import axios from "axios";

const API_BASE =
  import.meta.env.PROD
    ? "https://stock-nfpp.onrender.com"
    : "http://localhost:5000";

export const api = axios.create({
  baseURL: API_BASE,
});
