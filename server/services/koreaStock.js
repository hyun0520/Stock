import axios from "axios";
import { loadKoreaStocks } from "../utils/loadKoreaStocks.js";

/* ===============================
   🔍 국내주식 종목 검색 (CSV 기반)
   - 부분 검색 강화
   - 공백 / 대소문자 정규화
   - 종목코드 / 회사명 모두 지원
=============================== */
export async function searchKoreaStock(q = "") {
  if (!q) return [];

  const list = loadKoreaStocks();

  // 검색어 정규화
  const keywordRaw = q.trim();
  const keyword = keywordRaw.replace(/\s/g, "").toLowerCase();
  const isNumber = /^\d+$/.test(keyword);

  // 숫자면 종목코드 (6자리 패딩)
  const normalizedCode = isNumber
    ? keyword.padStart(6, "0")
    : null;

  return list
    .filter((item) => {
      const name = item.name.replace(/\s/g, "").toLowerCase();
      const symbol = item.symbol.toLowerCase();

      // 종목코드 검색
      if (normalizedCode && symbol.includes(normalizedCode)) {
        return true;
      }

      // 회사명 부분 검색
      return name.includes(keyword);
    })
    .slice(0, 20);
}

/* ===============================
   💰 국내주식 실시간 현재가 (NAVER)
=============================== */
export async function getKoreaStockDetail(symbol) {
  const url = `https://polling.finance.naver.com/api/realtime/domestic/stock/${symbol}`;

  const res = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Referer": "https://finance.naver.com"
    }
  });

  const item = res.data?.datas?.[0];

  if (!item) {
    console.error("❌ NAVER REALTIME EMPTY", res.data);
    return null;
  }

  return {
    symbol: item.itemCode || item.symbolCode,
    name: item.stockName,
    market: "KOREA",
    price: Number(String(item.closePrice).replace(/,/g, "")),
    change: Number(
      String(item.compareToPreviousClosePrice).replace(/,/g, "")
    ),
    rate: Number(item.fluctuationsRatio)
  };
}

/* ===============================
   📈 차트 (네이버 일봉)
=============================== */
export async function getKoreaStockChart(symbol, period = "1M") {
  const today = new Date();
  const end = formatDate(today);

  let startDate = offsetDate(today, -30);
  if (period === "1W") startDate = offsetDate(today, -7);
  if (period === "1D") startDate = offsetDate(today, -1);

  const start = formatDate(startDate);

  const url = `https://fchart.stock.naver.com/siseJson.naver?symbol=${symbol}&requestType=1&startTime=${start}&endTime=${end}&timeframe=day`;

  const res = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
      "Referer": "https://finance.naver.com"
    }
  });

  const raw = String(res.data)
    .replace(/'/g, '"')
    .replace(/\n/g, "");

  const parsed = JSON.parse(raw);
  parsed.shift(); // header 제거

  return parsed.map((row) => ({
    date: row[0],
    price: Number(row[4])
  }));
}

/* ===============================
   UTIL
=============================== */
function formatDate(date) {
  return date.toISOString().slice(0, 10).replace(/-/g, "");
}

function offsetDate(base, diff) {
  const d = new Date(base);
  d.setDate(d.getDate() + diff);
  return d;
}
