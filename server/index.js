import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import stockRoutes from "./routes/stock.js";
import watchlistRoutes from "./routes/watchlist.js";
import portfolioRoutes from "./routes/portfolio.js";
import cryptoRoutes from "./routes/crypto.js";
import searchRoutes from "./routes/search.js";
import usStockRoutes from "./routes/usStock.js";
import marketRouter from "./routes/market.js";
import fxRoutes from "./routes/fx.js";

// Routes
import userRoutes from "./routes/user.js";

dotenv.config();

mongoose
  .connect('mongodb+srv://ven160004_db_user:Hexlbh34!@cluster0.pvqlkqm.mongodb.net/')
  .then(() => console.log("🔥 MongoDB Connected"))
  .catch((err) => console.error("DB Error:", err));

const app = express();
const PORT = 5000;

app.use(cors());
app.use(express.json());

app.use("/api/auth", userRoutes);
app.use("/api/user", userRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/watchlist", watchlistRoutes);
app.use("/api/portfolio", portfolioRoutes);
app.use("/api/crypto", cryptoRoutes);
app.use("/api/search", searchRoutes);
app.use("/api/usStock", usStockRoutes);
app.use("/api/market", marketRouter);
app.use("/api/fx", fxRoutes);

app.get("/", (req, res) => {
  res.send("Server Running");
});

// const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
