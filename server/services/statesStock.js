import axios from "axios";
import YahooFinance from "yahoo-finance2";

const yahooFinance = new YahooFinance();
const BASE = "https://query1.finance.yahoo.com";

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
   range -> (period1, period2, interval)
=============================== */
function getRangeWindow(range) {
  const now = new Date();
  const end = new Date(now);

  let start = new Date(now);
  let interval = "1d";

  switch (range) {
    case "1d":
      start = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000); // 2일 버퍼
      interval = "5m";
      break;
    case "1w":
      start = new Date(now.getTime() - 10 * 24 * 60 * 60 * 1000); // 10일
      interval = "15m";
      break;
    case "1m":
      start.setMonth(now.getMonth() - 1);
      interval = "1d";
      break;
    case "3m":
      start.setMonth(now.getMonth() - 3);
      interval = "1d";
      break;
    case "1y":
      start.setFullYear(now.getFullYear() - 1);
      interval = "1d";
      break;
    case "5y":
      start.setFullYear(now.getFullYear() - 5);
      interval = "1wk";
      break;
    default:
      start.setMonth(now.getMonth() - 1);
      interval = "1d";
  }

  // yahoo-finance2는 초 단위 timestamp
  const period1 = Math.floor(start.getTime() / 1000);
  const period2 = Math.floor(end.getTime() / 1000);

  return { period1, period2, interval };
}

/* ===============================
  미국 주식 차트 (v3+ 호환)
=============================== */
export async function getStockChart(symbol, range = "1m") {
  const { period1, period2, interval } = getRangeWindow(range);

  try {
    // v3+에서는 period 대신 period1/period2 사용
    const result = await yahooFinance.chart(symbol, {
      period1,
      period2,
      interval
    });

    // 라이브러리 리턴 형태가 다를 수 있어서 둘 다 방어
    const quotes = result?.quotes || result?.indicators?.quote || [];

    if (Array.isArray(result?.quotes) && result.quotes.length) {
      return result.quotes
        .filter((q) => q.close != null && q.date)
        .map((q) => ({
          time: new Date(q.date).getTime(),
          price: Number(q.close)
        }));
    }

    // 혹시 다른 구조면 fallback: query1 직접 호출로 대체 가능
    return [];
  } catch (e) {
    console.error("US chart error:", symbol, e.message);
    return [];
  }
}
