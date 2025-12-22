import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

// ===============================
// 🔥 ENV
// ===============================
dotenv.config(); // Render / Local 공용

// ===============================
// 🔥 Routes
// ===============================
import stockRoutes from "./routes/stock.js";
import watchlistRoutes from "./routes/watchlist.js";
import portfolioRoutes from "./routes/portfolio.js";
import cryptoRoutes from "./routes/crypto.js";
import searchRoutes from "./routes/search.js";
import usStockRoutes from "./routes/usStock.js";
import marketRouter from "./routes/market.js";
import fxRoutes from "./routes/fx.js";
import userRoutes from "./routes/user.js";

// ===============================
// 🔥 App
// ===============================
const app = express();
const PORT = process.env.PORT || 5000;

// ===============================
// 🔥 Middleware (⚠️ 순서 중요)
// ===============================
app.use(cors());              // ⭐ 기본 CORS (문제 최소화)
app.use(express.json());      // ⭐ body parser

// ===============================
// 🔥 MongoDB
// ===============================
console.log("🔍 MONGO_URI:", process.env.MONGO_URI);

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("🔥 MongoDB Connected");
  })
  .catch((err) => {
    console.error("❌ MongoDB Connection Error:", err);
  });

// ===============================
// 🔥 API Routes
// ===============================
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

// ===============================
// 🔥 Health Check
// ===============================
app.get("/", (req, res) => {
  res.send("Server Running");
});

// ===============================
// 🔥 Start Server
// ===============================
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});