import {
  searchKoreaStock,
  getKoreaStockDetail,
  getKoreaStockChart
} from "../services/koreaStock.js";

/* 🔍 검색 */
export async function searchStock(req, res) {
  const { q } = req.query;
  res.json(searchKoreaStock(q));
}

/* 📌 상세 */
export async function getStockDetail(req, res) {
  const { symbol } = req.params;
  const data = await getKoreaStockDetail(symbol);
  res.json(data);
}

/* 📈 차트 */
export async function getStockChart(req, res) {
  const { symbol } = req.params;
  const { range = "1d" } = req.query;

  const data = await getKoreaStockChart(symbol, range);
  res.json(data);
}
