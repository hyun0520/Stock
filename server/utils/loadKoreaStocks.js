import fs from "fs";
import path from "path";
import iconv from "iconv-lite";
import { parse } from "csv-parse/sync";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let cache = null;

/**
 *  국내 주식 CSV 로드 (1회 로딩 + 캐싱)
 * - cp949 → utf-8 변환
 * - 종목코드 6자리 보정 (padStart)
 */
export function loadKoreaStocks() {
  if (cache) return cache;

  const filePath = path.resolve(__dirname, "../data/korea_stocks.csv");
  console.log("CSV PATH:", filePath);

  if (!fs.existsSync(filePath)) {
    console.error("CSV FILE NOT FOUND");
    return [];
  }

  // 파일 읽기 (Buffer)
  const buffer = fs.readFileSync(filePath);

  // cp949 → utf-8 디코딩
  const content = iconv.decode(buffer, "cp949");

  // CSV 파싱
  const rows = parse(content, {
    skip_empty_lines: true
  });

  // 첫 줄 = 헤더 제거
  rows.shift();

  // 데이터 정규화
  cache = rows
    .map((cols) => {
      const rawSymbol = String(cols[1] || "").trim();

      return {
        symbol: rawSymbol.padStart(6, "0"), //6자리 보정
        name: String(cols[2] || "").trim(),
        market: String(cols[6] || "").trim() // KOSPI / KOSDAQ
      };
    })
    .filter(
      (item) =>
        item.symbol.length === 6 &&
        item.name.length > 0
    );

  console.log("Korea stocks loaded:", cache.length);
  console.log("🔍 SAMPLE:", cache.slice(0, 5));

  return cache;
}
