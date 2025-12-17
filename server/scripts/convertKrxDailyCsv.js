import fs from "fs";
import path from "path";
import csv from "csv-parser";

const DATA_DIR = path.join(process.cwd(), "data");

function convert(type) {
  const csvPath = path.join(DATA_DIR, `${type}_daily.csv`);
  const jsonPath = path.join(DATA_DIR, `${type}_daily.json`);

  const rows = [];

  fs.createReadStream(csvPath)
    .pipe(
      csv({
        separator: ";",
        mapHeaders: ({ header }) =>
          header.replace("\ufeff", "").trim()
      })
    )
    .on("data", (r) => {
      // KRX 일봉 주요 컬럼
      // TRD_DD, CLSPRC, CMPPREVDD_PRC, FLUC_RT

      if (!r.TRD_DD || !r.CLSPRC) return;

      rows.push({
        date: r.TRD_DD,
        value: Number(r.CLSPRC.replace(/,/g, "")),
        change: Number((r.CMPPREVDD_PRC || "0").replace(/,/g, "")),
        changeRate: Number(r.FLUC_RT || 0)
      });
    })
    .on("end", () => {
      // 날짜 오름차순 정렬
      rows.sort((a, b) => a.date.localeCompare(b.date));

      fs.writeFileSync(jsonPath, JSON.stringify(rows, null, 2));
      console.log(`✅ ${type} DAILY JSON 생성 완료 (${rows.length})`);
    });
}

convert("kospi");
convert("kosdaq");
