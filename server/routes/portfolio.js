import express from "express";
import auth from "../middlewares/auth.js";
import {
  addPortfolio,
  getPortfolio,
  updatePortfolio,
  deletePortfolio
} from "../controllers/portfolio.js";

const router = express.Router();

router.post("/", auth, addPortfolio);
router.get("/", auth, getPortfolio);
router.put("/:id", auth, updatePortfolio);     
router.delete("/:id", auth, deletePortfolio); 

export default router;
