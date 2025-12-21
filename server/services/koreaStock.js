import axios from "axios";
import { loadKoreaStocks } from "../utils/loadKoreaStocks.js";
import { loadKrxDaily } from "../utils/loadKrxDaily.js";

/* ===============================
   🔍 검색
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
   📌 상세 (네이버 실시간)
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
    console.error("❌ getKoreaStockDetail error:", e.message);
    return null;
  }
}

/* ===============================
   📈 차트
   - 단기(1d/1w/1m/3m): 네이버
   - 그 외: KRX CSV
=============================== */
export async function getKoreaStockChart(symbol, range = "1d") {
  console.log("📈 chart request:", symbol, range);

  /* ===============================
     네이버 단기 차트
  =============================== */
  const fetchNaverChart = async () => {
    let timeframe = "day";
    let count = 30;

    if (range === "1d") {
      timeframe = "minute";
      count = 120;
    } else if (range === "1w") {
      timeframe = "day";
      count = 7;
    } else if (range === "1m") {
      timeframe = "day";
      count = 30;
    } else if (range === "3m") {
      timeframe = "day";
      count = 90;
    } else {
      return [];
    }

    const url =
      `https://fchart.stock.naver.com/siseJson.naver` +
      `?symbol=${symbol}` +
      `&requestType=1` +
      `&timeframe=${timeframe}` +
      `&count=${count}`;

    try {
      const res = await axios.get(url, {
        responseType: "text",
        headers: {
          "User-Agent": "Mozilla/5.0",
          Referer: "https://finance.naver.com"
        },
        validateStatus: (s) => s < 500
      });

      if (!res.data || res.status !== 200) return [];

      const cleaned = res.data
        .trim()
        .replace(/^\(|\);$/g, "")
        .replace(/'/g, '"')
        .replace(/\n/g, "");

      const parsed = JSON.parse(cleaned);
      parsed.shift(); // 헤더 제거

      return parsed
        .map((row) => {
          if (!row || row.length < 5) return null;

          const key = String(row[0]);
          const price = Number(row[4]);
          if (isNaN(price)) return null;

          // 분봉 YYYYMMDDHHmm
          if (key.length === 12) {
            const y = key.slice(0, 4);
            const m = key.slice(4, 6);
            const d = key.slice(6, 8);
            const hh = key.slice(8, 10);
            const mm = key.slice(10, 12);

            return {
              time: new Date(
                `${y}-${m}-${d}T${hh}:${mm}:00+09:00`
              ).getTime(),
              price
            };
          }

          // 일봉 YYYYMMDD
          if (key.length === 8) {
            const y = key.slice(0, 4);
            const m = key.slice(4, 6);
            const d = key.slice(6, 8);

            return {
              time: new Date(`${y}-${m}-${d}`).getTime(),
              price
            };
          }

          return null;
        })
        .filter(Boolean);
    } catch (e) {
      console.error("❌ Naver chart error:", e.message);
      return [];
    }
  };

  // ✅ 1️⃣ 단기면 네이버 먼저
  if (["1d", "1w", "1m", "3m"].includes(range)) {
    const naverData = await fetchNaverChart();
    console.log("📉 NAVER chart length:", naverData.length);

    if (naverData.length > 0) {
      return naverData;
    }
  }

  /* ===============================
     KRX fallback (항상 안정)
  =============================== */
  const krxData = loadKrxDaily(symbol, range);
  console.log("📊 KRX chart length:", krxData?.length || 0);

  return krxData || [];
}
