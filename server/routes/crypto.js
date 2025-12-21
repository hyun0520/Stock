import express from "express";
import {
  fetchCryptoPrice,
  fetchCryptoCandles,
  getCryptoMarkets,
  fetchCryptoDetail
} from "../controllers/crypto.js";

const router = express.Router();

router.get("/markets", getCryptoMarkets);
router.get("/price/:market", fetchCryptoPrice);
router.get("/candles/:market", fetchCryptoCandles);
router.get("/detail/:market", fetchCryptoDetail);
export default router;
