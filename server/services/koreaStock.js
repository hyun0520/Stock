import axios from "axios";
import { loadKoreaStocks } from "../utils/loadKoreaStocks.js";
import { getKoreaStockChart } from "./daumKoreaStockChart.js";

/* ===============================
   검색
=============================== */
export function searchKoreaStock(q = "") {
  if (!q) return [];

  const list = loadKoreaStocks();
  const keyword = q.replace(/\s/g, "").toLowerCase();

  return list
    .filter(
      (item) =>
        item.name.replace(/\s/g, "").toLowerCase().includes(keyword) ||
        item.symbol.includes(keyword)
    )
    .slice(0, 20);
}

/* ===============================
   상세 (네이버 실시간)
=============================== */
export async function getKoreaStockDetail(symbol) {
  const url = `https://polling.finance.naver.com/api/realtime/domestic/stock/${symbol}`;

  try {
    const res = await axios.get(url, {
      headers: {
        "User-Agent": "Mozilla/5.0",
        Referer: "https://finance.naver.com"
      },
      validateStatus: (s) => s < 500
    });

    const item = res.data?.datas?.[0];
    if (!item) return null;

    const toNum = (v) =>
      v !== undefined && v !== null
        ? Number(String(v).replace(/,/g, ""))
        : null;

    const price = toNum(item.closePrice);
    const change = toNum(item.compareToPreviousClosePrice);

    return {
      symbol: item.itemCode,
      name: item.stockName,
      market: "KOREA",

      price,
      change,
      rate: Number(item.fluctuationsRatio),
      prevPrice: price - change,

      open: toNum(item.openPrice),
      high: toNum(item.highPrice),
      low: toNum(item.lowPrice),
      volume: toNum(item.accumulatedTradingVolume)
    };
  } catch (e) {
    console.error("getKoreaStockDetail error:", e.message);
    return null;
  }
}

/* ===============================
   차트 (Daum Finance)
=============================== */
export async function getKoreaStockChartData(
  symbol,
  range = "1m"
) {
  const rangeMap = {
    "1d": "days",
    "1w": "weeks",
    "1m": "months",
    "3m": "months",
    "1y": "months",
    "5y": "months"
  };

  const daumRange = rangeMap[range] || "months";

  return getKoreaStockChart({
    symbol,
    range: daumRange
  });
}