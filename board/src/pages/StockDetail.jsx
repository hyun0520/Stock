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

export default function StockDetail() {
  const { symbol } = useParams();

  const [detail, setDetail] = useState(null);
  const [chart, setChart] = useState([]);
  const [loading, setLoading] = useState(true);

  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  // 포트폴리오 모달
  const [portfolioOpen, setPortfolioOpen] = useState(false);
  const [qty, setQty] = useState("");
  const [buy, setBuy] = useState("");
  const [msg, setMsg] = useState("");

  /* ===============================
     초기 상세 + 차트 로딩
  =============================== */
  useEffect(() => {
    let mounted = true;

    async function fetchInitial() {
      try {
        const [detailRes, chartRes] = await Promise.all([
          fetch(`/api/stock/korea/${symbol}`),
          fetch(`/api/stock/korea/${symbol}/chart`)
        ]);

        const detailData = await detailRes.json();
        const chartData = await chartRes.json();

        if (!mounted) return;

        setDetail(detailData || null);
        setChart(Array.isArray(chartData) ? chartData : []);
      } catch (err) {
        console.error("주식 초기 데이터 실패", err);
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
     ⚡ 현재가 실시간 폴링 (3초)
  =============================== */
  useEffect(() => {
    let timer;

    const fetchPrice = async () => {
      try {
        const res = await axios.get(`/api/stock/korea/${symbol}`);

        setDetail((prev) => {
        // 🔑 초기값이 없으면 서버 데이터로 전체 세팅
        if (!prev) return res.data;

        return {
          ...prev,
          price: res.data?.price ?? prev.price,
          change: res.data?.change ?? prev.change
          };
        });

      } catch (err) {
        console.error("주식 실시간 가격 실패", err);
      }
    };

    fetchPrice();
    timer = setInterval(fetchPrice, 3000);

    return () => clearInterval(timer);
  }, [symbol]);

  /* ===============================
     안전한 숫자 처리
  =============================== */
  const price =
    typeof detail?.price === "number" ? detail.price : 0;

  const change =
    typeof detail?.change === "number" ? detail.change : 0;

  /* ===============================
     ⭐ 관심종목 추가
  =============================== */
  const addToWatchlist = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return setError("로그인이 필요합니다.");

      await axios.post(
        "/api/watchlist",
        {
          symbol: detail.symbol,
          name: detail.name,
          market: "KOREA"
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setAdded(true);
      setError("");
    } catch (err) {
      setError("이미 관심종목이거나 오류가 발생했습니다.");
    }
  };

  /* ===============================
     📊 포트폴리오 등록
  =============================== */
  const addToPortfolio = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      setMsg("로그인이 필요합니다.");
      return;
    }

    if (!qty || !buy) {
      setMsg("보유 수량과 매수가를 입력하세요.");
      return;
    }

    try {
      await axios.post(
        "/api/portfolio",
        {
          symbol: detail.symbol,
          name: detail.name,
          market: "KOREA",
          quantity: Number(qty),
          buyPrice: Number(buy)
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
    } catch (e) {
      setMsg("이미 등록되었거나 오류가 발생했습니다.");
    }
  };

  /* ===============================
     렌더
  =============================== */
  if (loading) return <div style={{ padding: 40 }}>로딩 중...</div>;
  if (!detail) return <div style={{ padding: 40 }}>데이터 없음</div>;

  return (
    <div style={{ padding: "40px", maxWidth: 1100, margin: "0 auto" }}>
      {/* 상단 정보 */}
      <h1>
        {detail.name} ({detail.symbol})
      </h1>
      <p>{detail.market}</p>

      <div style={{ margin: "20px 0", fontSize: 22 }}>
        💰 현재가: <strong>{price.toLocaleString()}원</strong>
        <span
          style={{
            marginLeft: 12,
            color: change >= 0 ? "#ef4444" : "#3b82f6"
          }}
        >
          {change}
        </span>
      </div>

      {/* 차트 */}
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
          <LineChart data={Array.isArray(chart) ? chart : []}>
            <XAxis dataKey="date" tick={{ fill: "#9aa4b2" }} />
            <YAxis tick={{ fill: "#9aa4b2" }} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="price"
              stroke="#ff8a00"
              strokeWidth={2}
              dot={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* 액션 버튼 */}
      <div style={{ marginTop: 30, display: "flex", gap: 12 }}>
        <button
          onClick={addToWatchlist}
          disabled={added}
          style={{
            padding: "12px 20px",
            borderRadius: 10,
            background: added ? "#6b7280" : "#ff8a00",
            border: "none",
            fontWeight: 600,
            cursor: added ? "default" : "pointer",
            color: "white"
          }}
        >
          {added ? "⭐ 관심종목 추가됨" : "⭐ 관심종목 추가"}
        </button>

        <button
          onClick={() => setPortfolioOpen(true)}
          style={{
            padding: "12px 20px",
            borderRadius: 10,
            background: "#1f2937",
            border: "none",
            fontWeight: 600,
            cursor: "pointer",
            color: "white"
          }}
        >
          📊 포트폴리오 추가
        </button>
      </div>

      {error && <p style={{ marginTop: 10, color: "red" }}>{error}</p>}

      {/* ================= 모달 ================= */}
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
            <h3 style={{ marginBottom: 20 }}>📊 포트폴리오 추가</h3>

            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 13, color: "#9aa4b2" }}>
                보유 수량
              </label>
              <input
                type="number"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
                style={{
                  width: "100%",
                  height: 42,
                  marginTop: 6,
                  borderRadius: 8,
                  border: "none",
                  padding: "0 12px",
                  background: "#1f2937",
                  color: "white"
                }}
              />
            </div>

            <div>
              <label style={{ fontSize: 13, color: "#9aa4b2" }}>
                매수가 (원)
              </label>
              <input
                type="number"
                value={buy}
                onChange={(e) => setBuy(e.target.value)}
                style={{
                  width: "100%",
                  height: 42,
                  marginTop: 6,
                  borderRadius: 8,
                  border: "none",
                  padding: "0 12px",
                  background: "#1f2937",
                  color: "white"
                }}
              />
            </div>

            {msg && (
              <p style={{ marginTop: 12, fontSize: 13, color: "#22c55e" }}>
                {msg}
              </p>
            )}

            <div
              style={{
                display: "flex",
                justifyContent: "flex-end",
                gap: 10,
                marginTop: 20
              }}
            >
              <button
                onClick={() => setPortfolioOpen(false)}
                style={{
                  background: "#374151",
                  color: "white",
                  border: "none",
                  padding: "10px 14px",
                  borderRadius: 8
                }}
              >
                취소
              </button>
              <button
                onClick={addToPortfolio}
                style={{
                  background: "#ff8a00",
                  color: "white",
                  border: "none",
                  padding: "10px 16px",
                  borderRadius: 8,
                  fontWeight: 600
                }}
              >
                추가하기
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
