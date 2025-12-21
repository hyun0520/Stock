import { getRealtimePrice } from "./koreaStock.js";
import loadKoreaStocks from "../utils/loadKoreaStocks.js";

export async function getKoreaTopStocks(type = "up", limit = 5) {
  const stocks = loadKoreaStocks(); // CSV 로드
  const results = [];

  for (const stock of stocks) {
    try {
      const priceInfo = await getRealtimePrice(stock.code);

      const current = priceInfo.current;
      const prevClose = priceInfo.prevClose;

      if (!current || !prevClose) continue;

      const rate = ((current - prevClose) / prevClose) * 100;

      results.push({
        code: stock.code,
        name: stock.name,
        price: current,
        rate: Number(rate.toFixed(2))
      });

    } catch (e) {
      continue; // 실패 종목은 스킵
    }
  }

  return results
    .filter(r => type === "up" ? r.rate > 0 : r.rate < 0)
    .sort((a, b) =>
      type === "up" ? b.rate - a.rate : a.rate - b.rate
    )
    .slice(0, limit);
}
