from pykrx import stock
import pandas as pd
import os
from datetime import datetime, timedelta

SYMBOL = "114190"   # 강원에너지
YEARS = 5

end = datetime.today()
start = end - timedelta(days=365 * YEARS)

df = stock.get_market_ohlcv_by_date(
    start.strftime("%Y%m%d"),
    end.strftime("%Y%m%d"),
    SYMBOL
)

if df.empty:
    print("❌ 데이터 없음")
    exit()

df = df.reset_index()[["날짜", "종가"]]
df.columns = ["date", "close"]

os.makedirs("server/data/krx_daily", exist_ok=True)
df.to_csv(f"server/data/krx_daily/{SYMBOL}.csv", index=False)

print("✅ CSV 저장 완료:", SYMBOL)
