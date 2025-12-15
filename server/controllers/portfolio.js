import Portfolio from "../models/portfolio.js";

export const addPortfolio = async (req, res) => {
  try {
    const userId = req.user.id;
    const { symbol, name, market, quantity, buyPrice } = req.body;

    if (!symbol || !name || !market || !quantity || !buyPrice) {
      return res.status(400).json({ message: "필수 값 누락" });
    }

    const item = await Portfolio.create({
      user: userId,
      symbol,
      name,
      market,
      quantity,
      buyPrice
    });

    res.status(201).json(item);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ message: "이미 포트폴리오에 있음" });
    }
    res.status(500).json({ message: err.message });
  }
};

export const getPortfolio = async (req, res) => {
  try {
    const list = await Portfolio.find({ user: req.user.id }).sort({ createdAt: -1 });
    res.json(list);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/portfolio/:id
export const updatePortfolio = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, buyPrice } = req.body;

    const updated = await Portfolio.findOneAndUpdate(
      { _id: id, user: req.user.id },   // ⭐ 핵심
      { quantity, buyPrice },
      { new: true }
    );

    if (!updated) {
      return res.status(404).json({ message: "수정할 항목 없음" });
    }

    res.json(updated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/portfolio/:id
export const deletePortfolio = async (req, res) => {
  try {
    const { id } = req.params;

    const deleted = await Portfolio.findOneAndDelete({
      _id: id,
      user: req.user.id   // ⭐ 핵심
    });

    if (!deleted) {
      return res.status(404).json({ message: "삭제할 항목 없음" });
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

