// server/routes/usStock.js
import express from "express";
import { detail, chart } from "../controllers/usStock.js";

const router = express.Router();

/* ========= 미국주식 상세==========*/
router.get("/:symbol", detail);
/*========미국주식 차트 ======*/
router.get("/:symbol/chart", chart);

export default router;
