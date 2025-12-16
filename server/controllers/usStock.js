// server/controllers/usStock.js
import {
  getStockDetail,
  getStockChart
} from "../services/statesStock.js";

/**
 * 📄 미국주식 상세 (준실시간 1회 호출)
 * GET /api/usStock/:symbol
 */
export async function detail(req, res) {
  try {
    // 🔥 URL 파라미터를 "유일한 기준"으로 사용
    const symbol = req.params.symbol.toUpperCase();

    const raw = await getStockDetail(symbol);

    if (!raw) {
      return res.status(404).json({ message: "Symbol not found" });
    }

    res.json({
      symbol,                 // ✅ URL 기준 (TSLL 유지)
      name: raw.name || symbol,
      market: "US",
      price: raw.price ?? 0,
      rate: raw.rate ?? 0
    });
  } catch (err) {
    console.error("US STOCK DETAIL ERROR", err.message);
    res.status(500).json({ message: "US stock detail failed" });
  }
}

/**
 * 📈 미국주식 차트
 * GET /api/usStock/:symbol/chart
 */
export async function chart(req, res) {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const data = await getStockChart(symbol);
    res.json(data);
  } catch (err) {
    console.error("US STOCK CHART ERROR", err.message);
    res.status(500).json({ message: "US stock chart failed" });
  }
}
