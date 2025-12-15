import axios from "axios";

/* ⚡ 현재가 */
export async function getCryptoPrice(market) {
  try {
    const { data } = await axios.get(
      "https://api.upbit.com/v1/ticker",
      {
        params: { markets: market }
      }
    );

    return {
      market,
      price: data[0].trade_price,
      changeRate: (data[0].signed_change_rate * 100).toFixed(2)
    };
  } catch (err) {
    console.error("Upbit Price Error:", err.response?.data || err.message);
    throw new Error("Crypto price fetch failed");
  }
}

/* 📈 캔들 (일봉) */
export async function getCryptoCandles(market) {
  try {
    const { data } = await axios.get(
      "https://api.upbit.com/v1/candles/days",
      {
        params: {
          market,
          count: 30
        }
      }
    );

    return data;
  } catch (err) {
    console.error("Upbit Candle Error:", err.response?.data || err.message);
    throw new Error("Crypto candles fetch failed");
  }
}
