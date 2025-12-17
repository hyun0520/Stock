import axios from "axios";

const API = "http://localhost:5000/api/market";

export const getKOSPI = async () => (await axios.get(`${API}/kospi`)).data;
export const getNASDAQ = async () => (await axios.get(`${API}/nasdaq`)).data;
export const getFX = async () => (await axios.get(`${API}/fx`)).data;
