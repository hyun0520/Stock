import axios from "axios";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import AssetActions from "../components/AssetActions";

export default function StockDetailUS() {
  const { symbol } = useParams();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  // 💱 환율 (USD → KRW)
  const [usdRate, setUsdRate] = useState(1350);

  /* ===============================
     환율 가져오기 (10분 캐시)
  =============================== */
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await axios.get(
          "https://api.exchangerate.host/latest?base=USD&symbols=KRW"
        );
        setUsdRate(res.data.rates.KRW);
      } catch {
        // 실패 시 기존 값 유지
      }
    };

    fetchRate();
    const timer = setInterval(fetchRate, 10 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  /* ===============================
     🇺🇸 상세 정보 로드 (차트 ❌)
  =============================== */
  useEffect(() => {
    let mounted = true;

    async function fetchDetail() {
      try {
        const res = await axios.get(`/api/usStock/${symbol}`);
        if (!mounted) return;
        setDetail(res.data || null);
      } catch (err) {
        console.error("❌ US stock detail error", err);
        setError("미국 주식 정보를 불러오지 못했습니다.");
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
        const res = await axios.get("/api/watchlist", {
          headers: { Authorization: `Bearer ${token}` }
        });

        const exists = res.data.some(
          (item) => item.symbol === symbol && item.market === "US"
        );

        setAdded(exists);
      } catch (err) {
        console.error("❌ watchlist check failed", err);
      }
    }

    checkWatchlist();
  }, [symbol]);

  /* ===============================
    📈 차트 fetch (AssetActions용)
  =============================== */
  const fetchChartByRange = async (range) => {
    try {
      const res = await axios.get(
        `/api/usStock/${symbol}/chart`,
        { params: { range } }
      );

      return Array.isArray(res.data) ? res.data : [];
    } catch (e) {
      console.error("❌ US chart fetch failed", e);
      return [];
    }
  };


  /* ===============================
     계산값
  =============================== */
  const price =
    typeof detail?.price === "number" && detail.price > 0
      ? detail.price
      : 0;

  const rate =
    typeof detail?.rate === "number"
      ? detail.rate
      : 0;

  const diff =
    rate !== 0
      ? Number((price * (rate / 100)).toFixed(2))
      : 0;

  const isUp = diff > 0;
  const isDown = diff < 0;

  /* ===============================
     관심종목 추가
  =============================== */
  const addToWatchlist = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("로그인이 필요합니다.");
        return;
      }

      await axios.post(
        "/api/watchlist",
        {
          symbol: detail.symbol,
          name: detail.name || detail.symbol,
          market: "US"
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
     포트폴리오 추가
  =============================== */
  const addToPortfolio = async (qty, buy) => {
    const token = localStorage.getItem("token");
    if (!token) return "로그인이 필요합니다.";

    if (!qty || !buy || Number(qty) <= 0 || Number(buy) <= 0) {
      return "보유 수량과 매수가를 올바르게 입력하세요.";
    }

    try {
      const buyPriceKRW = Math.round(Number(buy) * usdRate);

      await axios.post(
        "/api/portfolio",
        {
          symbol: detail.symbol,
          name: detail.name || detail.symbol,
          market: "US",
          quantity: Number(qty),
          buyPrice: buyPriceKRW
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      return true;
    } catch (err) {
      return (
        err.response?.data?.msg ||
        "이미 등록되었거나 오류가 발생했습니다."
      );
    }
  };

  /* ===============================
     Render
  =============================== */
  if (loading) return <div style={{ padding: 40 }}>로딩 중...</div>;
  if (!detail) return <div style={{ padding: 40 }}>데이터 없음</div>;

  return (
    <div style={{ padding: "40px", maxWidth: 1100, margin: "0 auto" }}>
      <h1>
        {detail.name} ({detail.symbol})
      </h1>
      <p style={{ color: "#6b7280" }}>
        🇺🇸 미국주식 · 최근 조회 기준
      </p>

      <div style={{ margin: "14px 0 18px", fontSize: 22 }}>
        현재가: <strong>${price.toLocaleString()}</strong>

        <span
          style={{
            marginLeft: 12,
            color: isUp ? "#16a34a" : isDown ? "#dc2626" : "#9ca3af"
          }}
        >
          {isUp && "▲ "}
          {isDown && "▼ "}
          {diff >= 0 ? "+" : ""}
          ${Math.abs(diff).toLocaleString()} (
          {rate >= 0 ? "+" : ""}
          {rate.toFixed(2)}%)
        </span>
      </div>

      {/*  공통 차트 + 액션 */}
      <AssetActions
        fetchChart={fetchChartByRange}
        chartColor="#ff8a00"
        market="US"
        price={price}
        prevPrice={detail.prevPrice}
        change={diff}
        rate={rate}
        open={detail.open}
        high={detail.high}
        low={detail.low}
        volume={detail.volume}
        high52={detail.high52}
        low52={detail.low52}
        added={added}
        disabled={price <= 0}
        onAddWatch={addToWatchlist}
        onAddPortfolio={addToPortfolio}
        defaultRange="1d"
      />

      {error && <p style={{ marginTop: 10, color: "red" }}>{error}</p>}
    </div>
  );
}
