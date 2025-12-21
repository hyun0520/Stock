import express from "express";
import cors from "cors";
import dotenv from "dotenv";
dotenv.config({ path: "../.env" });
import mongoose from "mongoose";

// Routes
import stockRoutes from "./routes/stock.js";
import watchlistRoutes from "./routes/watchlist.js";
import portfolioRoutes from "./routes/portfolio.js";
import cryptoRoutes from "./routes/crypto.js";
import searchRoutes from "./routes/search.js";
import usStockRoutes from "./routes/usStock.js";
import marketRouter from "./routes/market.js";
import fxRoutes from "./routes/fx.js";
import userRoutes from "./routes/user.js";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
console.log("ENV CHECK:", process.env.MONGO_URI);
/* ===============================
   🔥 MongoDB
=============================== */
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("🔥 MongoDB Connected"))
  .catch((err) => {
    console.error("❌ DB Error:", err);
    process.exit(1);
  });

/* ===============================
   🔥 Middleware
=============================== */
app.use(cors());
app.use(express.json());

/* ===============================
   🔥 Routes
=============================== */
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

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
