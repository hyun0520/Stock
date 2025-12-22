import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import AssetActions from "../components/AssetActions";

export default function StockDetail() {
  const { symbol } = useParams();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  const format = (v) =>
    typeof v === "number" && !isNaN(v) ? v.toLocaleString() : "—";

  /* ===============================
     🇰🇷 국내주식 상세 정보
  =============================== */
  useEffect(() => {
    let mounted = true;

    async function fetchDetail() {
      try {
        const res = await api.get(`/stock/korea/${symbol}`);
        const data = Array.isArray(res.data)
          ? res.data[0]
          : res.data;

        if (mounted) setDetail(data);
      } catch (err) {
        console.error("❌ korea stock detail error", err);
        if (mounted) setError("주식 정보를 불러오지 못했습니다.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchDetail();
    return () => {
      mounted = false;
    };
  }, [symbol]);

  /* ===============================
     ⭐ 관심종목 체크
  =============================== */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    async function checkWatchlist() {
      try {
        const res = await api.get("/watchlist", {
          headers: { Authorization: `Bearer ${token}` }
        });

        const exists = res.data.some(
          (item) => item.symbol === symbol && item.market === "KR"
        );

        setAdded(exists);
      } catch (err) {
        console.error("❌ watchlist check failed", err);
      }
    }

    checkWatchlist();
  }, [symbol]);

  /* ===============================
     📈 차트 (range 전달)
  =============================== */
  const fetchChartByRange = useCallback(
    async (range) => {
      try {
        const res = await api.get(
          `/stock/korea/${symbol}/chart`,
          { params: { range } }
        );

        return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        console.error("❌ chart fetch error", err);
        return [];
      }
    },
    [symbol]
  );

  /* ===============================
     ⭐ 관심종목 추가
  =============================== */
  const addToWatchlist = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("로그인이 필요합니다.");
        return;
      }

      await api.post(
        "/watchlist",
        {
          symbol: detail.symbol,
          name: detail.name,
          market: "KR"
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setAdded(true);
      setError("");
    } catch {
      setError("이미 관심종목이거나 오류가 발생했습니다.");
    }
  };

  /* ===============================
     📌 포트폴리오 추가
  =============================== */
  const addToPortfolio = async (qty, buy) => {
    const token = localStorage.getItem("token");
    if (!token) return "로그인이 필요합니다.";

    if (!qty || !buy || Number(qty) <= 0 || Number(buy) <= 0) {
      return "보유 수량과 매수가를 올바르게 입력하세요.";
    }

    try {
      await api.post(
        "/portfolio",
        {
          symbol: detail.symbol,
          name: detail.name,
          market: "KR",
          quantity: Number(qty),
          buyPrice: Number(buy)
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      return true;
    } catch (err) {
      return (
        err.response?.data?.message ||
        "이미 등록되었거나 오류가 발생했습니다."
      );
    }
  };

  /* ===============================
     Render
  =============================== */
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
      <p style={{ color: "#6b7280" }}>
        🇰🇷 국내주식 · 최근 조회 기준
      </p>

      <div style={{ margin: "14px 0 18px", fontSize: 22 }}>
        현재가: <strong>{format(price)}원</strong>
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
        market="KR"
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
        onAddWatch={addToWatchlist}
        onAddPortfolio={addToPortfolio}
      />

      {error && <p style={{ color: "red" }}>{error}</p>}
    </div>
  );
}
