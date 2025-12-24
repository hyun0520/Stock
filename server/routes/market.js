import express from "express";
import fs from "fs";
import path from "path";
import axios from "axios";
import iconv from "iconv-lite";
import { fileURLToPath } from "url";

const router = express.Router();

/* ===============================
   dirname (ESM 대응)
================================ */
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/* ===============================
   INDEX (Yahoo Finance)
================================ */
router.get("/index/:market", async (req, res) => {
  try {
    const map = {
      kospi: "^KS11",
      kosdaq: "^KQ11",
      nasdaq: "^IXIC",
      sp500: "^GSPC"
    };

    const symbol = map[req.params.market];
    if (!symbol) return res.json(null);

    // 2일치 일봉 (전일 대비 계산용)
    const dailyUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=2d&interval=1d`;
    const dailyRes = await axios.get(dailyUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const daily = dailyRes.data.chart.result?.[0];
    if (!daily) return res.json(null);

    const closes = daily.indicators.quote[0].close;
    const prevClose = closes[closes.length - 2];
    const current = closes[closes.length - 1];

    const diff = current - prevClose;
    const rate = (diff / prevClose) * 100;

    // 장중 차트 (기존 그대로)
    const intradayUrl = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=1d&interval=5m`;
    const intradayRes = await axios.get(intradayUrl, {
      headers: { "User-Agent": "Mozilla/5.0" }
    });

    const result = intradayRes.data.chart.result?.[0];
    const chart = result.timestamp
      .map((t, i) => ({
        time: t * 1000, // 문자열 말고 timestamp 유지
        value: result.indicators.quote[0].close[i]
      }))
      .filter(d => d.value != null);

    res.json({
      price: Number(current.toFixed(2)),
      diff: Number(diff.toFixed(2)),
      rate: Number(rate.toFixed(2)),
      chart
    });
  } catch (e) {
    console.error("INDEX ERROR:", e.message);
    res.json(null);
  }
});

/* ===============================
  KRX CSV 로드 (EUC-KR)
================================ */
function loadKoreaStocks(limit = 120) {
  const csvPath = path.join(__dirname, "../data/korea_stocks.csv");

  const buffer = fs.readFileSync(csvPath);
  const content = iconv.decode(buffer, "EUC-KR");

  const rows = content
    .replace(/\r/g, "")
    .split("\n")
    .filter(Boolean);

  const header = rows[0]
    .split(",")
    .map(h => h.replace(/"/g, "").trim());

  const codeIndex = header.findIndex(h => h.includes("단축코드"));
  const nameIndex = header.findIndex(h => h.includes("한글 종목명"));

  if (codeIndex === -1 || nameIndex === -1) {
    console.error("CSV HEADER ERROR:", header);
    return [];
  }

  const stocks = rows
    .slice(1)
    .map(r => r.split(",").map(v => v.replace(/"/g, "").trim()))
    .filter(r => /^\d{6}$/.test(r[codeIndex]))
    .map(r => [r[codeIndex], r[nameIndex]])
    .slice(0, limit);

  console.log("KOREA STOCK COUNT:", stocks.length);
  console.log("SAMPLE:", stocks.slice(0, 3));

  return stocks;
}

/* ===============================
  등락률 계산
================================ */
async function calculateRates({ direction = "up", limit = 5 }) {
  const stocks = loadKoreaStocks();
  const results = [];

  for (const [code, name] of stocks) {
    try {
      const url = `https://polling.finance.naver.com/api/realtime/domestic/stock/${code}`;
      const { data } = await axios.get(url, {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Referer": "https://finance.naver.com"
        },
        timeout: 3000
      });

      const item = data?.datas?.[0];
      if (!item) continue;

      const price = Number(item.closePrice.replace(/,/g, ""));
      const diff = Number(item.compareToPreviousClosePrice.replace(/,/g, ""));
      const prev = price - diff;
      if (!prev) continue;

      const rate = (diff / prev) * 100;

      results.push({
        code,
        name,
        price: price.toLocaleString(),
        rate: rate.toFixed(2) + "%"
      });
    } catch {
      continue;
    }
  }

  return results
    .sort((a, b) =>
      direction === "up"
        ? parseFloat(b.rate) - parseFloat(a.rate)
        : parseFloat(a.rate) - parseFloat(b.rate)
    )
    .slice(0, limit);
}

/* ===============================
  상승 TOP
================================ */
router.get("/korea/top-gainers", async (req, res) => {
  const data = await calculateRates({ direction: "up" });
  res.json(data);
});

/* ===============================
  하락 TOP
================================ */
router.get("/korea/top-losers", async (req, res) => {
  const data = await calculateRates({ direction: "down" });
  res.json(data);
});

export default router;
