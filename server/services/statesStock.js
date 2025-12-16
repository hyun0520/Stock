// server/services/statesStock.js
import axios from "axios";

const BASE = "https://query1.finance.yahoo.com";

/* ===============================
   🇺🇸 미국주식 상세 + 가격 (차트 기반)
   - Yahoo 차트 API는 비교적 안 막힘
=============================== */
export async function getStockDetail(symbol) {
  try {
    const url = `${BASE}/v8/finance/chart/${symbol}`;

    const { data } = await axios.get(url, {
      params: {
        range: "5d",
        interval: "1d"
      },
      headers: {
        "User-Agent": "Mozilla/5.0",
        Referer: "https://finance.yahoo.com"
      },
      timeout: 8000
    });

    const result = data?.chart?.result?.[0];
    if (!result) throw new Error("No chart data");

    const meta = result.meta;
    const quote = result.indicators.quote[0];

    const lastIndex = quote.close.length - 1;
    const price = quote.close[lastIndex];
    const prev = quote.close[lastIndex - 1] ?? price;

    const rate = ((price - prev) / prev) * 100;

    return {
      symbol: meta.symbol,
      name: meta.shortName || meta.symbol,
      price: Number(price.toFixed(2)),
      rate: Number(rate.toFixed(2)),
      market: "US"
    };
  } catch (err) {
    console.error("US STOCK DETAIL FAILED", err.message);
    return null;
  }
}

/* ===============================
   📈 차트 데이터
=============================== */
export async function getStockChart(symbol) {
  try {
    const url = `${BASE}/v8/finance/chart/${symbol}`;

    const { data } = await axios.get(url, {
      params: {
        range: "1mo",
        interval: "1d"
      },
      headers: {
        "User-Agent": "Mozilla/5.0",
        Referer: "https://finance.yahoo.com"
      }
    });

    const result = data?.chart?.result?.[0];
    if (!result) return [];

    const { timestamp } = result;
    const quote = result.indicators.quote[0];

    return timestamp.map((t, i) => ({
      time: t * 1000,
      close: quote.close[i]
    }));
  } catch (err) {
    console.error("US STOCK CHART FAILED", err.message);
    return [];
  }
}
