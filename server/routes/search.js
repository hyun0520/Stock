import express from "express";
import {
  getSearchItems,
  getSearchPrices,
} from "../controllers/search.js";

const router = express.Router();

router.get("/", getSearchItems);
router.get("/price", getSearchPrices);

export default router;
