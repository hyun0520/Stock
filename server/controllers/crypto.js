import axios from "axios";
import {
  getCryptoPrice,
  getCryptoCandles as fetchCandlesFromService
} from "../services/crypto.js";

/* ⚡ 현재가 조회 */
export const fetchCryptoPrice = async (req, res) => {
  try {
    const { market } = req.params; // KRW-BTC
    const data = await getCryptoPrice(market);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* 📈 마켓 목록 */
export const getCryptoMarkets = async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.upbit.com/v1/market/all"
    );

    const krwMarkets = response.data.filter(
      (m) => m.market.startsWith("KRW-")
    );

    res.json(krwMarkets);
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch markets" });
  }
};

/* 📊 캔들 데이터 */
export const fetchCryptoCandles = async (req, res) => {
  try {
    const { market } = req.params;

    const data = await fetchCandlesFromService(market);

    res.json(data.reverse());
  } catch (err) {
    res.status(500).json({ message: "Failed to fetch candles" });
  }
};
