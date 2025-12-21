// server/routes/usStock.js
import express from "express";
import {
  getStockDetail,
  getUSStockChart
} from "../services/statesStock.js";

const router = express.Router();

/* ===============================
   🇺🇸 미국주식 상세
=============================== */
router.get("/:symbol", async (req, res) => {
  const { symbol } = req.params;
  const data = await getStockDetail(symbol);
  res.json(data);
});

/* ===============================
   📈 미국주식 차트
=============================== */
router.get("/:symbol/chart", async (req, res) => {
  const { symbol } = req.params;
  const { range = "1m" } = req.query;

  const chart = await getUSStockChart(symbol, range);
  res.json(chart);
});

export default router;
