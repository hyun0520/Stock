import mongoose from "mongoose";

const portfolioSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    symbol: { type: String, required: true },
    name: { type: String, required: true },
    market: { type: String, enum: ["KOREA", "US", "CRYPTO"], required: true },
    quantity: { type: Number, required: true },
    buyPrice: { type: Number, required: true }
  },
  { timestamps: true }
);

portfolioSchema.index(
  { user: 1, symbol: 1, market: 1 },
  { unique: true }
);

export default mongoose.model("Portfolio", portfolioSchema);
