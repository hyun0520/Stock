import express from "express";
import { detail, chart } from "../controllers/usStock.js";

const router = express.Router();

router.get("/:symbol", detail);        
router.get("/:symbol/chart", chart);   

export default router;
