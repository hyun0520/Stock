import mongoose from "mongoose";

const watchlistSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    symbol: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    market: {
      type: String,
      enum: ["KOREA", "USA", "CRYPTO"],
      required: true
    }
  },
  { timestamps: true }
);

// 같은 유저 + 같은 종목 중복 방지
watchlistSchema.index({ user: 1, symbol: 1 }, { unique: true });

export default mongoose.model("Watchlist", watchlistSchema);
