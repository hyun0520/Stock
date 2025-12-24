import {
  searchKoreaStock,
  getKoreaStockDetail
} from "../services/koreaStock.js";

import { getKoreaStockChart } from "../services/yahooKoreaStockChart.js";


/* ===============================
  국내주식 검색
================================ */
export async function searchStock(req, res) {
  const { q } = req.query;

  try {
    const result = searchKoreaStock(q);
    res.json(result);
  } catch (err) {
    console.error("❌ stock search error:", err);
    res.status(500).json([]);
  }
}

/* ===============================
  국내주식 상세
================================ */
export async function getStockDetail(req, res) {
  const { symbol } = req.params;

  try {
    const data = await getKoreaStockDetail(symbol);
    res.json(data);
  } catch (err) {
    console.error("❌ stock detail error:", err);
    res.status(500).json(null);
  }
}

/* ===============================
  국내주식 차트 (Yahoo Finance)
================================ */
export async function getKoreaStockChartController(req, res) {
  try {
    const { symbol } = req.params;
    const { range = "1m", market = "KOSPI" } = req.query;

    const chart = await getKoreaStockChart({
      symbol,
      market,
      range
    });

    res.json(chart);
  } catch (err) {
    console.error("❌ Korea chart error:", err);
    res.status(500).json({ message: "Chart fetch failed" });
  }
}
