// server/services/crypto.js
import axios from "axios";

/* ⚡ 현재가 */
export async function getCryptoPrice(market) {
  const { data } = await axios.get(
    "https://api.upbit.com/v1/ticker",
    { params: { markets: market } }
  );

  const d = data[0];

  return {
    price: d.trade_price,
    prevPrice: d.prev_closing_price,
    change: d.trade_price - d.prev_closing_price,
    rate: d.signed_change_rate * 100,
    volume: d.acc_trade_volume_24h
  };
}

/* 📈 기간별 캔들 */
export async function getCryptoCandlesByRange(market, range = "1m") {
  const map = {
    "1d": { url: "minutes/10", count: 144 },
    "1w": { url: "days", count: 7 },
    "1m": { url: "days", count: 30 },
    "3m": { url: "days", count: 90 },
    "1y": { url: "weeks", count: 52 },
    "5y": { url: "months", count: 60 }
  };

  const { url, count } = map[range] || map["1m"];

  const { data } = await axios.get(
    `https://api.upbit.com/v1/candles/${url}`,
    { params: { market, count } }
  );

  return data;
}

/* 🧠 코인 상세 (한글명 포함) */
export async function getCryptoDetail(market) {
  // ✅ 같은 파일이므로 import 없이 바로 호출
  const priceData = await getCryptoPrice(market);

  // 마켓 이름 (한글)
  const { data: markets } = await axios.get(
    "https://api.upbit.com/v1/market/all"
  );

  const marketInfo = markets.find(
    (m) => m.market === market
  );

  // 52주 계산용 일봉
  const { data: candles } = await axios.get(
    "https://api.upbit.com/v1/candles/days",
    { params: { market, count: 365 } }
  );

  const prices = candles.map((c) => c.trade_price);
  const today = candles[0];

  return {
    symbol: market,
    code: market.replace("KRW-", ""),
    nameKr: marketInfo?.korean_name ?? "",
    nameEn: marketInfo?.english_name ?? "",
    market: "CRYPTO",

    price: priceData.price,
    prevPrice: priceData.prevPrice,
    change: Number(priceData.change.toFixed(0)),
    rate: Number(priceData.rate.toFixed(2)),

    open: today.opening_price,
    high: today.high_price,
    low: today.low_price,
    volume: Math.floor(priceData.volume),

    high52: Math.max(...prices),
    low52: Math.min(...prices)
  };
}
