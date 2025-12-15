import {
  searchKoreaStock,
  getKoreaStockDetail,
  getKoreaStockChart
} from "../services/koreaStock.js";

/* 검색 */
export async function searchStock(req, res) {
  try {
    const { q } = req.query;
    const result = await searchKoreaStock(q || "");
    res.json(result);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
}


/* 국내주식 상세 */
export async function getStockDetail(req, res) {
  console.log("🔥 getStockDetail HIT");

  const { symbol } = req.params;
  const data = await getKoreaStockDetail(symbol);

  if (!data) {
    return res.status(404).json({ message: "종목 없음" });
  }

  res.json(data);
}

/* 차트 */
export async function getStockChart(req, res) {
  const { symbol } = req.params;
  const data = await getKoreaStockChart(symbol);
  res.json(data);
}
