import express from "express";
import {
  searchStock,
  getStockDetail,
  getStockChart
} from "../controllers/stock.js";

const router = express.Router();

router.get("/search", searchStock);
router.get("/korea/:symbol", getStockDetail);
router.get("/korea/:symbol/chart", getStockChart);

export default router;
