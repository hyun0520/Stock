// server/controllers/search.js
import axios from "axios";
import { searchKoreaStock } from "../services/koreaStock.js";

/**
 * 통합 검색 (CRYPTO + KR + US)
 * GET /api/search?query=
 */
export const getSearchItems = async (req, res) => {
  try {
    const q = (req.query.query || "").trim();
    if (!q) return res.json([]);

    const keyword = q.toUpperCase();
    let results = [];

    /* =========================
      가상화폐 (Upbit)
    ========================= */
    const { data: cryptoData } = await axios.get(
      "https://api.upbit.com/v1/market/all"
    );

    const cryptoResults = cryptoData
      .filter(
        (m) =>
          m.market.startsWith("KRW-") &&
          (m.korean_name.includes(q) ||
            m.market.replace("KRW-", "").includes(keyword))
      )
      .map((m) => ({
        type: "CRYPTO",
        symbol: m.market,          // KRW-BTC
        name: m.korean_name        // 비트코인
      }));

    results.push(...cryptoResults);

    /* =========================
      국내주식 (CSV)
    ========================= */
    const krStocks = await searchKoreaStock(q);

    const krResults = krStocks.map((s) => ({
      type: "KR",
      symbol: s.symbol,            // 005930
      name: s.name                 // 삼성전자
    }));

    results.push(...krResults);

    /* =========================
      미국주식 (Yahoo Finance 검색 API)
    ========================= */
    // 영어 검색일 때만
    if (/^[A-Z.]{1,10}$/.test(keyword)) {
      try {
        const { data } = await axios.get(
          "https://query1.finance.yahoo.com/v1/finance/search",
          {
            params: {
              q: keyword,
              quotesCount: 10,
              newsCount: 0
            },
            headers: {
              "User-Agent": "Mozilla/5.0",
              Referer: "https://finance.yahoo.com"
            },
            timeout: 8000
          }
        );

        const quotes = data?.quotes || [];

        const usResults = quotes
          .filter(
            (q) =>
              q.symbol &&
              (q.quoteType === "EQUITY" ||
                q.quoteType === "ETF")
          )
          .map((q) => ({
            type: "US",
            symbol: q.symbol,        // TSLA, TSLL
            name:
              q.shortname ||
              q.longname ||
              q.symbol
          }));

        results.push(...usResults);
      } catch (e) {
        console.error("Yahoo US search failed", e.message);
      }
    }

    // 최대 30개 제한
    res.json(results.slice(0, 30));
  } catch (err) {
    console.error("Search failed", err);
    res.status(500).json({ message: "Search failed" });
  }
};

/**
 * 검색 결과 가격
 * GET /api/search/price?type=KR&symbol=005930
 */
export const getSearchPrices = async (req, res) => {
  const { type, symbol } = req.query;

  try {
    if (type === "CRYPTO") {
      const { data } = await axios.get(
        "https://api.upbit.com/v1/ticker",
        { params: { markets: symbol } }
      );

      return res.json({
        price: data[0].trade_price,
        changeRate: data[0].signed_change_rate * 100
      });
    }
    if (type === "KR") {
      const { data } = await axios.get(
        `http://localhost:5000/api/stock/korea/${symbol}`
      );

      return res.json({
        price: data.price,
        changeRate: data.rate
      });
    }

    if (type === "US") {
      const { data } = await axios.get(
        `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`,
        {
          params: {
            range: "2d",      // 🔥 2일 (등락 계산용)
            interval: "1d"
          },
          headers: {
            "User-Agent": "Mozilla/5.0",
            Referer: "https://finance.yahoo.com"
          }
        }
      );

      const result = data?.chart?.result?.[0];
      if (!result) return res.json(null);

      const quote = result.indicators.quote[0];
      const closes = quote.close.filter(Boolean);

      if (closes.length < 2) {
        return res.json({
          price: closes.at(-1) ?? 0,
          changeRate: 0
        });
      }

      const today = closes.at(-1);
      const prev = closes.at(-2);

      return res.json({
        price: Number(today.toFixed(2)),
        changeRate: Number(
          (((today - prev) / prev) * 100).toFixed(2)
        )
      });
    }


      res.status(400).json({ message: "Invalid type" });
    } catch (err) {
      console.error("Price fetch failed", err);
      res.status(500).json({ message: "Price fetch failed" });
    }
};

