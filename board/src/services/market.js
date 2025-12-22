import { api } from "./api";

/* 🔥 market index */
export const getKOSPI = async () =>
  (await api.get("/market/index/kospi")).data;

export const getKOSDAQ = async () =>
  (await api.get("/market/index/kosdaq")).data;

export const getNASDAQ = async () =>
  (await api.get("/market/index/nasdaq")).data;

export const getSP500 = async () =>
  (await api.get("/market/index/sp500")).data;

/* 🔥 환율 */
export const getFX = async () =>
  (await api.get("/fx")).data;
