import axios from "axios";

/**
 * 네이버 단기 차트 (1d / 1w / 1m / 3m)
 */
export async function getNaverShortChart(symbol, range = "1d") {
  let timeframe = "day";
  let count = 30;

  if (range === "1d") {
    timeframe = "minute";
    count = 120; // 최근 분봉
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

  const res = await axios.get(url, {
    responseType: "text",
    headers: {
      "User-Agent": "Mozilla/5.0",
      Referer: "https://finance.naver.com"
    },
    timeout: 5000
  });

  if (!res.data) return [];

  const cleaned = res.data
    .trim()
    .replace(/^\(|\);$/g, "")
    .replace(/'/g, '"')
    .replace(/\n/g, "");

  const parsed = JSON.parse(cleaned);
  parsed.shift(); // 헤더 제거

  return parsed
    .map(row => {
      const key = String(row[0]);
      const price = Number(row[4]);

      // 분봉 YYYYMMDDHHmm
      if (key.length === 12) {
        const y = key.slice(0, 4);
        const m = key.slice(4, 6);
        const d = key.slice(6, 8);
        const hh = key.slice(8, 10);
        const mm = key.slice(10, 12);
        return {
          time: new Date(`${y}-${m}-${d}T${hh}:${mm}:00+09:00`).getTime(),
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
}
