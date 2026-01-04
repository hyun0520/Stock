import axios from "axios";
import YahooFinance from "yahoo-finance2";
import { getCache, setCache } from "../utils/chartCache.js";

const yahooFinance = new YahooFinance();
const BASE = "https://query1.finance.yahoo.com";
const API_KEY = process.env.ALPHA_VANTAGE_KEY;
const BASE_URL = "https://www.alphavantage.co/query";
console.log("DEBUG getCache:", getCache);
/* ===============================
  미국주식 상세 정보
=============================== */
export async function getStockDetail(symbol) {
  try {
    const { data } = await axios.get(`${BASE}/v8/finance/chart/${symbol}`, {
      params: { range: "5d", interval: "1d" },
      headers: {
        "User-Agent": "Mozilla/5.0",
        Referer: "https://finance.yahoo.com"
      },
      timeout: 8000
    });

    const result = data?.chart?.result?.[0];
    if (!result) return null;

    const meta = result.meta || {};
    const quote = result.indicators?.quote?.[0];
    if (!quote?.close?.length) return null;

    const last = quote.close.length - 1;

    const price = quote.close[last];
    const prev = quote.close[last - 1] ?? price;

    const change = price - prev;
    const rate = prev ? (change / prev) * 100 : 0;

    return {
      symbol: meta.symbol || symbol,
      name: meta.shortName || meta.longName || symbol,
      market: "US",

      price: Number(price?.toFixed(2)) || 0,
      prevPrice: Number(prev?.toFixed(2)) || 0,
      change: Number(change?.toFixed(2)) || 0,
      rate: Number(rate?.toFixed(2)) || 0,

      open: Number(quote.open?.[last]) || null,
      high: Number(quote.high?.[last]) || null,
      low: Number(quote.low?.[last]) || null,
      volume: Number(quote.volume?.[last]) || null,

      high52: meta.fiftyTwoWeekHigh ?? null,
      low52: meta.fiftyTwoWeekLow ?? null
    };
  } catch (err) {
    console.error("US STOCK DETAIL FAILED:", err.message);
    return null;
  }
}

/* ===============================
   🇺🇸 미국 주식 차트 (일봉)
   - Alpha Vantage
   - 3시간 캐시
=============================== */
// 🔥 미국 주식 차트 (Alpha Vantage)
export async function getStockChart(symbol, range = "1mo") {
  const cacheKey = `US_CHART_${symbol}_${range}_ALPHA`;

  const cached = getCache(cacheKey);
  if (cached) return cached;

  try {
    const { data } = await axios.get(BASE_URL, {
      params: {
        function: "TIME_SERIES_DAILY",
        symbol,
        outputsize: "compact",
        apikey: API_KEY
      }
    });

    // ❗ Alpha Vantage 에러 응답 처리
    if (data.Note || data["Error Message"]) {
      console.error("ALPHA VANTAGE ERROR:", data);
      return [];
    }

    const raw = data["Time Series (Daily)"];
    if (!raw) return [];

    let chart = Object.entries(raw)
      .map(([date, v]) => ({
        date,
        open: +v["1. open"],
        high: +v["2. high"],
        low: +v["3. low"],
        close: +v["4. close"],
        volume: +v["5. volume"]
      }))
      .reverse();

    chart = sliceByRange(chart, range);

    // ✅ 데이터 있을 때만 캐시
    if (chart.length > 0) {
      setCache(cacheKey, chart, "1m"); // 3시간
    }

    return chart;
  } catch (err) {
    console.error("getStockChart ERROR:", err.message);
    return [];
  }
}


/* ===============================
   range → 데이터 개수 매핑
=============================== */
function sliceByRange(chart, range) {
  switch (range) {
    case "1d":
      return chart.slice(-1);
    case "5d":
      return chart.slice(-5);
    case "1mo":
      return chart.slice(-22);
    case "3mo":
      return chart.slice(-66);
    case "6mo":
      return chart.slice(-132);
    case "1y":
      return chart.slice(-252);
    case "5y":
      return chart.slice(-252 * 5);
    default:
      return chart.slice(-60);
  }
}