// server/services/marketIndex.js
import axios from "axios";

const YAHOO = "https://query1.finance.yahoo.com/v8/finance/chart";

export async function fetchIndex(symbol) {
  const { data } = await axios.get(`${YAHOO}/${symbol}`, {
    params: {
      range: "2d",
      interval: "1d"
    },
    headers: {
      "User-Agent": "Mozilla/5.0"
    }
  });

  const result = data.chart.result[0];
  const quote = result.indicators.quote[0];

  const prev = quote.close[quote.close.length - 2];
  const current = quote.close[quote.close.length - 1];

  const diff = current - prev;
  const rate = (diff / prev) * 100;

  return {
    price: Number(current.toFixed(2)),
    diff: Number(diff.toFixed(2)),
    rate: Number(rate.toFixed(2)),
    chart: result.timestamp.map((t, i) => ({
      time: t * 1000,
      value: quote.close[i]
    }))
  };
}
