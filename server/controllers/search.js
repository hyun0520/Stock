import axios from "axios";
import { searchKoreaStock } from "../services/koreaStock.js";

/**
 * 🔍 통합 검색 (CRYPTO + KR)
 * GET /api/search?query=삼성
 */
export const getSearchItems = async (req, res) => {
  try {
    const q = (req.query.query || "").trim();

    let results = [];

    /* =========================
       🪙 가상화폐 (Upbit)
    ========================= */
    const { data: cryptoData } = await axios.get(
      "https://api.upbit.com/v1/market/all"
    );

    const cryptoResults = cryptoData
      .filter(
        (m) =>
          m.market.startsWith("KRW-") &&
          m.korean_name.includes(q)
      )
      .map((m) => ({
        type: "CRYPTO",
        symbol: m.market,        // KRW-BTC
        name: m.korean_name,     // 비트코인
      }));

    results.push(...cryptoResults);

    /* =========================
       🇰🇷 국내주식 (CSV)
    ========================= */
    if (q) {
      const krStocks = await searchKoreaStock(q);

      const krResults = krStocks.map((s) => ({
        type: "KR",
        symbol: s.symbol,  // 005930
        name: s.name,      // 삼성전자
      }));

      results.push(...krResults);
    }

    res.json(results.slice(0, 30));
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Search failed" });
  }
};

/**
 * 💰 검색 결과 가격
 */
export const getSearchPrices = async (req, res) => {
  const { type, symbol } = req.query;

  try {
    // 🪙 가상화폐
    if (type === "CRYPTO") {
      const { data } = await axios.get(
        "https://api.upbit.com/v1/ticker",
        { params: { markets: symbol } }
      );

      return res.json({
        price: data[0].trade_price,
        changeRate: data[0].signed_change_rate * 100,
      });
    }

    // 🇰🇷 국내주식
    if (type === "KR") {
      const { data } = await axios.get(
        `http://localhost:5000/api/stock/korea/${symbol}`
      );

      return res.json({
        price: data.price,
        changeRate: data.rate,
      });
    }
  } catch (err) {
    res.status(500).json({ message: "Price fetch failed" });
  }
};
