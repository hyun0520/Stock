import express from "express";
import {
  searchStock,
  getStockDetail,
  getKoreaStockChartController
} from "../controllers/stock.js";

const router = express.Router();

router.get("/search", searchStock);
router.get("/korea/:symbol", getStockDetail);
router.get("/korea/:symbol/chart", getKoreaStockChartController);

export default router;