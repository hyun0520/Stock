import Watchlist from "../models/watchlist.js";

/**
 * POST /api/watchlist
 */
export const addWatchlist = async (req, res) => {
  try {
    const userId = req.user.id;
    const { symbol, name, market } = req.body;

    if (!symbol || !name || !market) {
      return res.status(400).json({ message: "필수 값 누락" });
    }

    const item = await Watchlist.create({
      user: userId,
      symbol,
      name,
      market
    });

    res.status(201).json(item);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "이미 관심종목에 있음" });
    }
    res.status(500).json({ message: err.message });
  }
};

/**
 * GET /api/watchlist
 */
export const getWatchlist = async (req, res) => {
  try {
    const userId = req.user.id;

    // user 필드로 조회
    const list = await Watchlist.find({ user: userId })
      .sort({ createdAt: -1 });

    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

/**
 * DELETE /api/watchlist/:id
 */
export const removeWatchlist = async (req, res) => {
  try {
    const { id } = req.params;

    // user 필드로 삭제
    await Watchlist.deleteOne({
      _id: id,
      user: req.user.id
    });

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
