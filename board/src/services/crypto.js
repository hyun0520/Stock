import { api } from "./api";

/* 업비트 종목 목록 (검색용) */
export const fetchCrypto = async () => {
  const res = await api.get("/crypto/markets");
  return res.data;
};

/* 캔들 데이터 (차트용) */
export const fetchCryptoCandles = async (market) => {
  const res = await api.get(`/crypto/candles/${market}`);
  return res.data;
};

/* 실시간 가격 (폴링용) */
export const fetchCryptoPrice = async (market) => {
  const res = await api.get(`/crypto/price/${market}`);
  return res.data;
};
