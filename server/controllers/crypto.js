// server/controllers/crypto.js
import axios from "axios";
import {
  getCryptoPrice,
  getCryptoCandlesByRange,
  getCryptoDetail
} from "../services/crypto.js";

/* ⚡ 현재가 */
export const fetchCryptoPrice = async (req, res) => {
  try {
    const { market } = req.params;
    const data = await getCryptoPrice(market);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/* 📊 마켓 목록 */
export const getCryptoMarkets = async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.upbit.com/v1/market/all"
    );

    const krwMarkets = response.data.filter(
      (m) => m.market.startsWith("KRW-")
    );

    res.json(krwMarkets);
  } catch {
    res.status(500).json({ message: "Failed to fetch markets" });
  }
};

/* 📈 기간별 캔들 */
export const fetchCryptoCandles = async (req, res) => {
  try {
    const { market } = req.params;
    const { range } = req.query;

    const data = await getCryptoCandlesByRange(market, range);
    res.json(data.reverse());
  } catch {
    res.status(500).json({ message: "Failed to fetch candles" });
  }
};

/* 🧠 코인 상세 */
export const fetchCryptoDetail = async (req, res) => {
  try {
    const { market } = req.params;
    const data = await getCryptoDetail(market);
    res.json(data);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
