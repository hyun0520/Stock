import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

export default function StockDetailUS() {
  const { symbol } = useParams();

  const [detail, setDetail] = useState(null);
  const [chart, setChart] = useState([]);
  const [loading, setLoading] = useState(true);

  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  // 💱 실시간 환율 (기본값 fallback)
  const [usdRate, setUsdRate] = useState(1350);

  // 포트폴리오 모달
  const [portfolioOpen, setPortfolioOpen] = useState(false);
  const [qty, setQty] = useState("");
  const [buy, setBuy] = useState(""); // 🔹 달러 입력
  const [msg, setMsg] = useState("");

  /* ===============================
     💱 환율 가져오기 (10분 캐시)
     - 실패 시 기존 환율 유지
  =============================== */
  useEffect(() => {
    const fetchRate = async () => {
      try {
        const res = await axios.get(
          "https://api.exchangerate.host/latest?base=USD&symbols=KRW"
        );
        setUsdRate(res.data.rates.KRW);
      } catch {
        // 실패해도 기존 값 유지
      }
    };

    fetchRate(); // 최초 1회
    const timer = setInterval(fetchRate, 10 * 60 * 1000); // 10분

    return () => clearInterval(timer);
  }, []);

  /* ===============================
     🇺🇸 초기 상세 + 차트
  =============================== */
  useEffect(() => {
    let mounted = true;

    async function fetchInitial() {
      try {
        const [detailRes, chartRes] = await Promise.all([
          axios.get(`/api/usStock/${symbol}`),
          axios.get(`/api/usStock/${symbol}/chart`)
        ]);

        if (!mounted) return;

        setDetail(detailRes.data || null);
        setChart(Array.isArray(chartRes.data) ? chartRes.data : []);
      } catch (err) {
        console.error("미국주식 초기 데이터 실패", err);
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchInitial();
    return () => {
      mounted = false;
    };
  }, [symbol]);

  /* ===============================
     ⭐ 이미 관심종목인지 서버 기준 체크
  =============================== */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    async function checkWatchlist() {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/watchlist",
          { headers: { Authorization: `Bearer ${token}` } }
        );

        const exists = res.data.some(
          (item) => item.symbol === symbol && item.market === "US"
        );

        setAdded(exists);
      } catch (err) {
        console.error("관심종목 체크 실패", err);
      }
    }

    checkWatchlist();
  }, [symbol]);

  /* ===============================
     💰 가격 fallback 처리
  =============================== */
  const fallbackPrice =
    chart.length > 0
      ? chart[chart.length - 1]?.close ?? 0
      : 0;

  const price =
    typeof detail?.price === "number" && detail.price > 0
      ? detail.price
      : fallbackPrice;

  const rate =
    typeof detail?.rate === "number"
      ? detail.rate
      : 0;

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
     📊 포트폴리오 등록
     👉 달러 입력 → 실시간 환율로 원화 변환
  =============================== */
  const addToPortfolio = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMsg("로그인이 필요합니다.");
      return;
    }

    if (!qty || !buy || Number(qty) <= 0 || Number(buy) <= 0) {
      setMsg("보유 수량과 매수가를 올바르게 입력하세요.");
      return;
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

      setMsg("✅ 포트폴리오에 등록되었습니다.");
      setTimeout(() => {
        setPortfolioOpen(false);
        setQty("");
        setBuy("");
        setMsg("");
      }, 800);
    } catch (err) {
      setMsg(
        err.response?.data?.msg ||
        "이미 등록되었거나 오류가 발생했습니다."
      );
    }
  };

  /* ===============================
     렌더
  =============================== */
  if (loading) return <div style={{ padding: 40 }}>로딩 중...</div>;
  if (!detail) return <div style={{ padding: 40 }}>데이터 없음</div>;

  return (
    <div style={{ padding: "40px", maxWidth: 1100, margin: "0 auto" }}>
      <h1>
        {detail.name} ({detail.symbol})
      </h1>
      <p>🇺🇸 미국주식 · 최근 조회 기준</p>

      <div style={{ margin: "20px 0", fontSize: 22 }}>
        💰 현재가: <strong>${price.toLocaleString()}</strong>
        <span
          style={{
            marginLeft: 12,
            color: rate >= 0 ? "#ef4444" : "#3b82f6"
          }}
        >
          {rate >= 0 ? "+" : ""}
          {rate.toFixed(2)}%
        </span>
      </div>

      {/* 📈 차트 */}
      <div
        style={{
          width: "100%",
          height: 320,
          background: "#0b0e11",
          borderRadius: 12,
          padding: 20
        }}
      >
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chart}>
            <XAxis
              dataKey="time"
              tick={{ fill: "#9aa4b2" }}
              tickFormatter={(t) => new Date(t).toLocaleDateString()}
            />
            <YAxis tick={{ fill: "#9aa4b2" }} />
            <Tooltip
              labelFormatter={(t) => new Date(t).toLocaleDateString()}
            />
            <Line
              type="monotone"
              dataKey="close"
              stroke="#ff8a00"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 버튼 */}
      <div style={{ marginTop: 30, display: "flex", gap: 12 }}>
        <button
          onClick={addToWatchlist}
          disabled={added || price <= 0}
          style={{
            padding: "12px 20px",
            borderRadius: 10,
            background:
              added || price <= 0 ? "#6b7280" : "#ff8a00",
            border: "none",
            fontWeight: 600,
            color: "white",
            cursor: added ? "not-allowed" : "pointer"
          }}
        >
          {added ? "⭐ 관심종목 추가됨" : "⭐ 관심종목 추가"}
        </button>

        <button
          onClick={() => setPortfolioOpen(true)}
          disabled={price <= 0}
          style={{
            padding: "12px 20px",
            borderRadius: 10,
            background: price <= 0 ? "#6b7280" : "#1f2937",
            border: "none",
            fontWeight: 600,
            color: "white"
          }}
        >
          📊 포트폴리오 추가
        </button>
      </div>

      {error && <p style={{ marginTop: 10, color: "red" }}>{error}</p>}

      {/* 포트폴리오 모달 */}
      {portfolioOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.65)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 2000
          }}
        >
          <div
            style={{
              width: 360,
              background: "#0b0e11",
              borderRadius: 14,
              padding: 24,
              color: "white"
            }}
          >
            <h3>📊 포트폴리오 추가</h3>

            <input
              type="number"
              placeholder="보유 수량"
              value={qty}
              onChange={(e) => setQty(e.target.value)}
              style={{
                width: "100%",
                height: 42,
                marginTop: 12,
                borderRadius: 8,
                border: "none",
                padding: "0 12px",
                background: "#1f2937",
                color: "white"
              }}
            />

            <input
              type="number"
              placeholder="매수가 ($)"
              value={buy}
              onChange={(e) => setBuy(e.target.value)}
              style={{
                width: "100%",
                height: 42,
                marginTop: 10,
                borderRadius: 8,
                border: "none",
                padding: "0 12px",
                background: "#1f2937",
                color: "white"
              }}
            />

            {msg && (
              <p style={{ marginTop: 10, color: "#22c55e" }}>{msg}</p>
            )}

            <div style={{ marginTop: 20, display: "flex", gap: 10 }}>
              <button
                onClick={() => setPortfolioOpen(false)}
                style={{
                  flex: 1,
                  background: "#374151",
                  color: "white",
                  border: "none",
                  padding: 10,
                  borderRadius: 8
                }}
              >
                취소
              </button>
              <button
                onClick={addToPortfolio}
                style={{
                  flex: 1,
                  background: "#ff8a00",
                  color: "white",
                  border: "none",
                  padding: 10,
                  borderRadius: 8,
                  fontWeight: 600
                }}
              >
                추가
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
