import express from "express";
import axios from "axios";

const router = express.Router();

/* ===============================
  ECB 영업일 계산
=============================== */
const getLastBusinessDay = (date) => {
  const d = new Date(date);
  do {
    d.setDate(d.getDate() - 1);
  } while (d.getDay() === 0 || d.getDay() === 6);
  return d;
};

router.get("/", async (req, res) => {
  try {
    const latestDay = getLastBusinessDay(new Date());
    const prevDay = getLastBusinessDay(latestDay);

    const latestStr = latestDay.toISOString().slice(0, 10);
    const prevStr = prevDay.toISOString().slice(0, 10);

    const [latestRes, prevRes] = await Promise.all([
      axios.get(`https://api.frankfurter.app/${latestStr}?from=KRW`),
      axios.get(`https://api.frankfurter.app/${prevStr}?from=KRW`)
    ]);

    const t = latestRes.data.rates;
    const y = prevRes.data.rates;

    const calc = (code, multiply = 1) => {
      const todayRate = (1 / t[code]) * multiply;
      const yesterdayRate = (1 / y[code]) * multiply;

      const change =
        ((todayRate - yesterdayRate) / yesterdayRate) * 100;

      return {
        rate: Number(todayRate.toFixed(2)),
        change: Number(change.toFixed(2))
      };
    };

    res.json({
      source: "유럽중앙은행(ECB)",
      baseDate: latestStr,
      compareDate: prevStr,
      USD: calc("USD"),
      JPY: calc("JPY", 100),
      CAD: calc("CAD"),
      EUR: calc("EUR")
    });

  } catch (err) {
    console.error("FX API ERROR", err.message);
    res.status(500).json({ message: "환율 데이터 오류" });
  }
});

export default router;
