// services/yahooKoreaStockChart.js
import YahooFinance from "yahoo-finance2";

/* ===============================
   📈 Yahoo Finance Instance (v3 필수)
=============================== */
const yahooFinance = new YahooFinance();

/* ===============================
   📈 Korea Stock Chart
=============================== */
export async function getKoreaStockChart({
  symbol,
  market = "KOSPI",
  range = "1m"
}) {
  const suffix = market === "KOSDAQ" ? ".KQ" : ".KS";
  const ticker = `${symbol}${suffix}`;

  const now = Math.floor(Date.now() / 1000);

  const rangeMap = {
    "1d": 1,
    "1w": 7,
    "1m": 30,
    "3m": 90,
    "1y": 365,
    "5y": 365 * 5
  };

  const days = rangeMap[range] || 30;
  const period1 = now - days * 24 * 60 * 60;

  const result = await yahooFinance.chart(ticker, {
    period1,
    period2: now,
    interval: range === "1d" ? "5m" : "1d"
  });

  if (!result || !Array.isArray(result.quotes)) {
    return [];
  }

  return result.quotes
    .filter(q => q.close !== null)
    .map(q => ({
      time: q.date,
      price: q.close
    }));
}
