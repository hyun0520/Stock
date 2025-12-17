import express from "express";
import axios from "axios";

const router = express.Router();

router.get("/", async (req, res) => {
  try {
    // ✅ Frankfurter API
    const response = await axios.get(
      "https://api.frankfurter.app/latest?from=KRW"
    );

    const rates = response.data.rates;

    if (!rates || !rates.USD) {
      throw new Error("환율 데이터 없음");
    }

    const usd = 1 / rates.USD;
    const jpy = (1 / rates.JPY) * 100;
    const cad = 1 / rates.CAD;
    const eur = 1 / rates.EUR;

    res.json({
      USD: {
        rate: Number(usd.toFixed(2)),
        change: 0.22   // 임시
      },
      JPY: {
        rate: Number(jpy.toFixed(2)),
        change: 0.47
      },
      CAD: {
        rate: Number(cad.toFixed(2)),
        change: 0.19
      },
      EUR: { 
        rate: Number(eur.toFixed(2)), 
        change: 0.15 
      }
    });

  } catch (err) {
    console.error("FX API ERROR", err.message);
    res.status(500).json({
      message: "환율 데이터를 불러올 수 없습니다."
    });
  }
});

export default router;
