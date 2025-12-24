import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/**
 *   KRX 일봉 CSV 로드
 * - 종목별 CSV 파일 읽기
 */
export function loadKrxDaily(symbol, years = 5) {
  const filePath = path.resolve(
    __dirname,
    "../data/krx_daily",
    `${symbol}.csv`
  );

  // 파일 없으면 빈 배열
  if (!fs.existsSync(filePath)) {
    return [];
  }

  const raw = fs.readFileSync(filePath, "utf-8");
  const lines = raw.trim().split("\n");

  // 헤더 제거
  lines.shift();

  const cutoff = new Date();
  cutoff.setFullYear(cutoff.getFullYear() - years);

  return lines
    .map((line) => {
      const [date, close] = line.split(",");

      const time = new Date(date).getTime();
      const price = Number(close);

      if (isNaN(time) || isNaN(price)) return null;

      return { time, price };
    })
    .filter(
      (row) =>
        row &&
        row.time >= cutoff.getTime()
    );
}
