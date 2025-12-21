import fs from "fs";
import path from "path";
import csv from "csv-parser";

const DATA_DIR = path.join(process.cwd(), "data");

function convert(type) {
  const csvPath = path.join(DATA_DIR, `${type}_intraday.csv`);
  const jsonPath = path.join(DATA_DIR, `${type}_intraday.json`);

  const rows = [];

  fs.createReadStream(csvPath)
    .pipe(
      csv({
        separator: ";",          // 🔥 KRX 기본 구분자
        mapHeaders: ({ header }) =>
          header.replace("\ufeff", "").trim() // 🔥 BOM 제거
      })
    )
    .on("data", (r) => {
      // 실제 키를 전부 콘솔로 확인하고 싶으면 주석 해제
      // console.log(r);

      const timeRaw = r.TRD_TM || r.시간 || r.time;
      const valueRaw = r.CLSPRC || r.지수 || r.value;

      if (!timeRaw || !valueRaw) return;

      rows.push({
        time:
          timeRaw.includes(":")
            ? timeRaw
            : timeRaw.slice(0, 2) + ":" + timeRaw.slice(2),
        value: Number(String(valueRaw).replace(/,/g, "")),
        change: Number(String(r.CMPPREVDD_PRC || r.전일대비 || 0).replace(/,/g, "")),
        changeRate: Number(r.FLUC_RT || r.등락률 || 0)
      });
    })
    .on("end", () => {
      fs.writeFileSync(jsonPath, JSON.stringify(rows, null, 2));
      console.log(`${type} JSON 생성 완료 (${rows.length})`);
    });
}

convert("kospi");
convert("kosdaq");
