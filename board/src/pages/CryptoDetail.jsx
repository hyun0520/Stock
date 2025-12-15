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

export default function CryptoDetail() {
  const { market } = useParams(); // KRW-BTC

  const [detail, setDetail] = useState(null);
  const [chart, setChart] = useState([]);
  const [loading, setLoading] = useState(true);

  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  // 🔥 포트폴리오 모달
  const [portfolioOpen, setPortfolioOpen] = useState(false);
  const [qty, setQty] = useState("");
  const [buy, setBuy] = useState("");
  const [msg, setMsg] = useState("");

  // 🔴🟢 실시간 가격 상태
  const [prevPrice, setPrevPrice] = useState(null);
  const [priceUp, setPriceUp] = useState(null); // true | false | null

  /* ================= 최초 데이터 로드 ================= */
  useEffect(() => {
    async function fetchData() {
      try {
        // 📌 현재가
        const detailRes = await axios.get("/api/search/price", {
          params: { type: "CRYPTO", symbol: market }
        });

        // 📈 차트 (일봉)
        const chartRes = await axios.get(`/api/crypto/candles/${market}`);

        setDetail({
          symbol: market,
          name: market.replace("KRW-", ""),
          market: "CRYPTO",
          price: detailRes.data.price,
          change:
            (detailRes.data.changeRate >= 0 ? "+" : "") +
            Number(detailRes.data.changeRate).toFixed(2) +
            "%"
        });

        setPrevPrice(detailRes.data.price);

        setChart(
          chartRes.data.map((c) => ({
            date: c.candle_date_time_kst.slice(0, 10),
            price: c.trade_price
          }))
        );
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [market]);

  /* ================= ⚡ 실시간 현재가 폴링 (3초) ================= */
  useEffect(() => {
    if (!market) return;

    let timer;

    const fetchPrice = async () => {
      try {
        const res = await axios.get("/api/search/price", {
          params: { type: "CRYPTO", symbol: market }
        });

        const newPrice = res.data.price;

        setDetail((prev) => {
          if (!prev) return prev;

          if (prevPrice !== null) {
            if (newPrice > prevPrice) setPriceUp(true);
            else if (newPrice < prevPrice) setPriceUp(false);
          }

          return {
            ...prev,
            price: newPrice,
            change:
              (res.data.changeRate >= 0 ? "+" : "") +
              Number(res.data.changeRate).toFixed(2) +
              "%"
          };
        });

        setPrevPrice(newPrice);

        // ✨ 깜빡임 리셋
        setTimeout(() => setPriceUp(null), 600);
      } catch (err) {
        console.error("실시간 가격 실패", err);
      }
    };

    fetchPrice(); // 최초 1회
    timer = setInterval(fetchPrice, 3000);

    return () => clearInterval(timer);
  }, [market, prevPrice]);

  /* ⭐ 관심종목 추가 */
  const addToWatchlist = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) return setError("로그인이 필요합니다.");

      await axios.post(
        "http://localhost:5000/api/watchlist",
        {
          symbol: detail.symbol,
          name: detail.name,
          market: "CRYPTO"
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setAdded(true);
      setError("");
    } catch {
      setError("이미 관심종목이거나 오류가 발생했습니다.");
    }
  };

  /* 📊 포트폴리오 등록 */
  const addToPortfolio = async () => {
    const token = localStorage.getItem("token");
    if (!token) return setMsg("로그인이 필요합니다.");
    if (!qty || !buy) return setMsg("보유 수량과 매수가를 입력하세요.");

    try {
      await axios.post(
        "http://localhost:5000/api/portfolio",
        {
          symbol: detail.symbol,
          name: detail.name,
          market: "CRYPTO",
          quantity: Number(qty),
          buyPrice: Number(buy)
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      setMsg("✅ 포트폴리오에 등록되었습니다.");
      setTimeout(() => {
        setPortfolioOpen(false);
        setQty("");
        setBuy("");
        setMsg("");
      }, 800);
    } catch {
      setMsg("이미 등록되었거나 오류가 발생했습니다.");
    }
  };

  /* ================= 렌더 ================= */
  if (loading) return <div style={{ padding: 40 }}>로딩 중...</div>;
  if (!detail) return <div>데이터 없음</div>;

  return (
    <div style={{ padding: "40px", maxWidth: 1100, margin: "0 auto" }}>
      <h1>
        {detail.name} ({detail.symbol})
      </h1>
      <p>{detail.market}</p>

      {/* 실시간 가격 */}
      <div
        style={{
          margin: "20px 0",
          fontSize: 24,
          fontWeight: 400,
          transition: "all 0.3s ease",
          color:
            priceUp === null
              ? "#111827"
              : priceUp
              ? "#16a34a"
              : "#dc2626"
        }}
      >
        현재가{" "}
        <strong style={{ fontSize: 28 }}>
          {detail.price.toLocaleString()}원
        </strong>

        <span
          style={{
            marginLeft: 14,
            fontSize: 16,
            fontWeight: 500,
            color: detail.change.startsWith("+")
              ? "#16a34a"
              : "#dc2626"
          }}
        >
          {detail.change}
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

      {/* ⭐ 버튼 */}
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
            color: "white"
          }}
        >
          📊 포트폴리오 추가
        </button>
      </div>

      {error && <p style={{ color: "red", marginTop: 10 }}>{error}</p>}

      {/* 📊 모달 */}
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
              style={{ width: "100%", marginTop: 12 }}
            />
            <input
              type="number"
              placeholder="매수가"
              value={buy}
              onChange={(e) => setBuy(e.target.value)}
              style={{ width: "100%", marginTop: 12 }}
            />

            {msg && <p style={{ color: "#22c55e" }}>{msg}</p>}

            <div style={{ marginTop: 20, textAlign: "right" }}>
              <button onClick={() => setPortfolioOpen(false)}>취소</button>
              <button onClick={addToPortfolio}>추가</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
