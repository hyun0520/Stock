import express from "express";
import {
  fetchCryptoPrice,
  fetchCryptoCandles,
  getCryptoMarkets
} from "../controllers/crypto.js";

const router = express.Router();

router.get("/markets", getCryptoMarkets);
router.get("/price/:market", fetchCryptoPrice);
router.get("/candles/:market", fetchCryptoCandles);

export default router;
