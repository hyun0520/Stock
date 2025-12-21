import axios from "axios";

export async function getKoreaStockChart(symbol, range = "1d") {
  const is1d = range === "1d";
  const timeframe = is1d ? "minute" : "day";
  const count = is1d ? 400 : 365;

  const url = `https://fchart.stock.naver.com/siseJson.naver?symbol=${symbol}&requestType=1&timeframe=${timeframe}&count=${count}`;

  const res = await axios.get(url, {
    responseType: "text",
    headers: {
      "User-Agent": "Mozilla/5.0",
      Referer: "https://finance.naver.com"
    }
  });

  const cleaned = res.data
    .trim()
    .replace(/^\(|\);$/g, "")
    .replace(/'/g, '"')
    .replace(/\n/g, "");

  const parsed = JSON.parse(cleaned);
  parsed.shift();

  return parsed
    .map(row => {
      const key = String(row[0]);
      const price = Number(row[4]);

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
      return null;
    })
    .filter(Boolean);
}
