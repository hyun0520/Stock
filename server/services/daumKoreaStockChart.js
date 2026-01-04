// services/daumKoreaStockChart.js

import axios from "axios";
import { getCache, setCache } from "../utils/chartCache.js";

/* ===============================
  Daum Finance Chart (Controlled)
=============================== */

const cooldown = new Map();
const COOLDOWN_TIME = 10 * 60 * 1000; // 10분
const DEFAULT_TTL = 60 * 1000;        // 60초 캐시

const RANGE_MAP = {
  "1d": "days",
  "1w": "weeks",
  "1m": "months",
  "3m": "months",
  "1y": "months",
  "5y": "months"
};

export async function getKoreaStockChart(symbol, range = "1d") {
  /* ===== 방어 ===== */
  if (typeof symbol === "object" && symbol !== null) {
    range = symbol.range || range;
    symbol = symbol.symbol;
  }

  if (!symbol || typeof symbol !== "string") {
    console.warn("⚠️ invalid symbol:", symbol);
    return [];
  }

  const daumRange = RANGE_MAP[range] || "days";
  const cacheKey = `DAUM:${symbol}:${range}`;

  /* ===== 캐시 ===== */
  const cached = getCache(cacheKey);
  if (cached) {
    console.log("🟢 daum chart cache hit:", cacheKey);
    return cached;
  }

  /* ===== 쿨다운 ===== */
  const cdKey = `${symbol}:${range}`;
  const cdUntil = cooldown.get(cdKey);
  if (cdUntil && Date.now() < cdUntil) {
    console.warn("⏸ Daum cooldown:", cdKey);
    return [];
  }

  const url = `https://finance.daum.net/api/charts/A${symbol}/${daumRange}?limit=200&adjusted=true`;

  try {
    console.log("🔵 chart fetch from Daum:", cacheKey);

    const res = await axios.get(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
        "Referer": `https://finance.daum.net/chart/A${symbol}`
      },
      timeout: 5000
    });

    const raw = res.data?.data || [];

    const data = raw
      .filter(d => d.tradePrice != null && d.date)
      .map(d => {
        let time;

        // 🔥 핵심: months 날짜 보정
        if (daumRange === "months") {
          // "2025-01" → 2025-01-31
          const [y, m] = d.date.split("-");
          time = new Date(Number(y), Number(m), 0).getTime();
        } else {
          // days / weeks
          time = new Date(d.date).getTime();
        }

        return {
          time,
          price: d.tradePrice
        };
      })
      .filter(d => Number.isFinite(d.time));

    setCache(cacheKey, data, DEFAULT_TTL);
    return data;

  } catch (err) {
    const status = err.response?.status;

    if (status === 403 || status === 429) {
      console.warn("🚫 Daum rate limited → cooldown");
      cooldown.set(cdKey, Date.now() + COOLDOWN_TIME);
      return [];
    }

    console.error("❌ Daum chart error:", err.message);
    return [];
  }
}
