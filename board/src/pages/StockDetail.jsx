import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import AssetActions from "../components/AssetActions";

export default function StockDetail() {
  const { symbol } = useParams();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  const format = (v) =>
    typeof v === "number" && !isNaN(v) ? v.toLocaleString() : "—";

  useEffect(() => {
    let mounted = true;

    axios
      .get(`http://localhost:5000/api/stock/korea/${symbol}`)
      .then((res) => {
        const data = Array.isArray(res.data) ? res.data[0] : res.data;
        if (mounted) setDetail(data);
      })
      .catch(() => mounted && setError("주식 정보를 불러오지 못했습니다."))
      .finally(() => mounted && setLoading(false));

    return () => (mounted = false);
  }, [symbol]);

  /* ✅ range에 맞춰 서버에 range 전달 */
  const fetchChartByRange = useCallback(
    async (range) => {
      try {
        const res = await axios.get(
          `http://localhost:5000/api/stock/korea/${symbol}/chart`,
          {
            params: { range } // ⭐️ 여기!!
          }
        );

        if (!Array.isArray(res.data)) return [];

        return res.data;
      } catch (err) {
        console.error("차트 조회 실패", err);
        return [];
      }
    },
    [symbol]
  );


  if (loading) return <div style={{ padding: 40 }}>로딩 중...</div>;
  if (!detail) return <div style={{ padding: 40 }}>데이터 없음</div>;

  const {
    name,
    symbol: code,
    price,
    change,
    rate,
    prevPrice,
    open,
    high,
    low,
    volume,
    high52,
    low52
  } = detail;

  const isUp = change > 0;
  const isDown = change < 0;

  return (
    <div style={{ padding: "40px", maxWidth: 1100, margin: "0 auto" }}>
      <h1>
        {name} ({code})
      </h1>
      <p style={{ color: "#6b7280" }}>KOREA · 최근 조회 기준</p>

      <div style={{ margin: "14px 0 18px", fontSize: 22 }}>
        현재가: {format(price)}원
        <span
          style={{
            marginLeft: 12,
            color: isUp ? "#ef4444" : isDown ? "#3b82f6" : "#9ca3af"
          }}
        >
          {isUp && "▲ "}
          {isDown && "▼ "}
          {format(change)} ({rate}%)
        </span>
      </div>

      <AssetActions
        fetchChart={fetchChartByRange}
        defaultRange="1d"
        chartColor="#ff8a00"
        price={price}
        prevPrice={prevPrice}
        change={change}
        rate={rate}
        open={open}
        high={high}
        low={low}
        volume={volume}
        high52={high52}
        low52={low52}
        added={added}
        disabled={!price}
        onAddWatch={() => {}}
        onAddPortfolio={() => {}}
      />

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
