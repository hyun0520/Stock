import axios from "axios";
import fs from "fs";
import path from "path";

/**
 * KRX 지수 일별 데이터 (KOSPI / KOSDAQ)
 * - 무료
 * - 공식 CSV
 * - 차단 거의 없음
 */

const DATA_DIR = path.join(process.cwd(), "data");
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR);

async function fetchDaily(type) {
  const today = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const from = new Date(Date.now() - 120 * 24 * 60 * 60 * 1000)
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, "");

  const url = "https://data.krx.co.kr/comm/fileDn/GenerateCSV.cmd";

  const params = {
    bld: "dbms/MDC/STAT/standard/MDCSTAT00301",
    locale: "ko_KR",
    idxIndMidclssCd: type === "KOSPI" ? "01" : "02",
    strtDd: from,
    endDd: today
  };

  const res = await axios.post(
    url,
    new URLSearchParams(params),
    {
      responseType: "arraybuffer",
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0 Safari/537.36",
        Referer: "https://data.krx.co.kr/",
        "Content-Type": "application/x-www-form-urlencoded"
      },
      timeout: 15000
    }
  );

  const csv = res.data.toString("utf-8");

  if (csv.includes("<html")) {
    throw new Error(`${type} DAILY CSV 응답이 HTML (차단됨)`);
  }

  const filePath = path.join(
    DATA_DIR,
    `${type.toLowerCase()}_daily.csv`
  );

  fs.writeFileSync(filePath, csv);
  console.log(`✅ ${type} DAILY CSV 저장 완료`);
}

await fetchDaily("KOSPI");
await fetchDaily("KOSDAQ");
