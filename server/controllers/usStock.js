// server/controllers/usStock.js
import {
  getStockDetail,
  getStockChart
} from "../services/statesStock.js";

/**
 * 📄 미국주식 상세
 * GET /api/usStock/:symbol
 */
export async function detail(req, res) {
  try {
    const symbol = req.params.symbol.toUpperCase();
    const data = await getStockDetail(symbol);

    if (!data) {
      return res.status(404).json({ message: "Symbol not found" });
    }

    res.json(data);
  } catch (err) {
    console.error("US STOCK DETAIL ERROR:", err.message);
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
    const { range = "1mo" } = req.query;

    const data = await getStockChart(symbol, range);
    res.json(data);
  } catch (err) {
    console.error("US STOCK CHART ERROR:", err.message);
    res.status(500).json({ message: "US stock chart failed" });
  }
}
