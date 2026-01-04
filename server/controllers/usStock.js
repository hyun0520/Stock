// server/controllers/usStock.js
import {
  getStockDetail,
  getStockChart
} from "../services/statesStock.js";

console.log("🔥 usStock controller LOADED");

/**
 * 미국주식 상세
 */
export async function detail(req, res) {
  console.log("🔥 detail controller HIT", req.params);
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
 * 미국주식 차트
 */
export async function chart(req, res) {
  console.log("🔥 chart controller HIT", req.params, req.query);

  try {
    const symbol = req.params.symbol.toUpperCase();
    const { range = "1mo" } = req.query;

    console.log("🔥 BEFORE getStockChart");
    const data = await getStockChart(symbol, range);
    console.log("🔥 AFTER getStockChart", Array.isArray(data), data?.length);

    res.json(data);
  } catch (err) {
    console.error("US STOCK CHART ERROR:", err.message);
    res.status(500).json({ message: "US stock chart failed" });
  }
}
