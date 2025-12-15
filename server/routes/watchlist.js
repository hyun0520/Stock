import express from "express";
import {
  addWatchlist,
  getWatchlist,
  removeWatchlist
} from "../controllers/watchlist.js";
import auth from "../middlewares/auth.js";

const router = express.Router();

router.post("/", auth, addWatchlist);
router.get("/", auth, getWatchlist);
router.delete("/:id", auth, removeWatchlist);

export default router;
