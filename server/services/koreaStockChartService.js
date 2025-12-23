import fs from "fs";
import path from "path";
import csv from "csv-parser";

/**
 * CSV 기반 국내주식 차트
 * @param {string} symbol
 * @param {string} range (1d | 1w | 1m)
 */
export async function getKoreaStockChart(symbol, range = "1d") {
  const filePath = path.resolve(
    `server/data/krx_daily/${symbol}.csv`
  );

  if (!fs.existsSync(filePath)) {
    return [];
  }

  return new Promise((resolve, reject) => {
    const rows = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on("data", (row) => {
        rows.push({
          time: row.date || row.time,
          price: Number(row.close || row["종가"])
        });
      })
      .on("end", () => {
        let count = 100;
        if (range === "1w") count = 5;
        if (range === "1m") count = 22;

        resolve(rows.slice(-count));
      })
      .on("error", reject);
  });
}
