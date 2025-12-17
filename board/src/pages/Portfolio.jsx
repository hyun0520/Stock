import { useEffect, useState } from "react";
import axios from "axios";
import "../styles/global.css";
import { fetchCryptoPrice } from "../services/crypto";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer
} from "recharts";

// 달러 → 원 환율
const USD_TO_KRW = 1474;

export default function Portfolio() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editId, setEditId] = useState(null);
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState(""); // 🔹 US는 달러 입력

  // 현재가 저장 (id → price, 원화 기준)
  const [priceMap, setPriceMap] = useState({});

  const token = localStorage.getItem("token");
   /* ===============================
     종목 수만큼 자동으로 다른 색 생성
  =============================== */
  const generateColors = (count) => {
    const colors = [];
    for (let i = 0; i < count; i++) {
      const hue = Math.floor((360 / count) * i);
      colors.push(`hsl(${hue}, 70%, 55%)`);
    }
    return colors;
  };

  /* ===============================
     포트폴리오 불러오기
  =============================== */
  useEffect(() => {
    if (!token) return;

    axios
      .get("http://localhost:5000/api/portfolio", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => setList(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  /* ===============================
     🔥 현재가 불러오기 (주식 + 코인, 3초 폴링)
     - US: USD → KRW
  =============================== */
  useEffect(() => {
    if (!list.length) return;

    let timer;

    const fetchPrices = async () => {
      const prices = {};

      for (const item of list) {
        try {
          if (item.market === "CRYPTO") {
            const data = await fetchCryptoPrice(item.symbol);
            prices[item._id] = data.price;

          } else if (item.market === "US") {
            const res = await axios.get(
              `http://localhost:5000/api/usStock/${item.symbol}`
            );
            const usd = res.data.price || 0;
            prices[item._id] = Math.round(usd * USD_TO_KRW);

          } else {
            const res = await axios.get(
              `http://localhost:5000/api/stock/korea/${item.symbol}`
            );
            prices[item._id] = res.data.price;
          }
        } catch {
          prices[item._id] = priceMap[item._id] || 0;
        }
      }

      setPriceMap(prices);
    };

    fetchPrices();
    timer = setInterval(fetchPrices, 3000);

    return () => clearInterval(timer);
  }, [list]);

  /* ===============================
     삭제
  =============================== */
  const handleDelete = async (id) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    await axios.delete(`http://localhost:5000/api/portfolio/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    setList((prev) => prev.filter((i) => i._id !== id));
  };

  /* ===============================
     수정 시작
     - US: 원화 → 달러로 변환해서 input에 표시
  =============================== */
  const startEdit = (item) => {
    setEditId(item._id);
    setQty(item.quantity);

    if (item.market === "US") {
      setPrice((item.buyPrice / USD_TO_KRW).toFixed(2)); // $ 표시
    } else {
      setPrice(item.buyPrice);
    }
  };

  /* ===============================
     수정 저장
     - US: 달러 → 원화로 변환 후 저장
  =============================== */
  const saveEdit = async (id) => {
    const item = list.find((i) => i._id === id);
    if (!item) return;

    let buyPriceKRW = Number(price);

    if (item.market === "US") {
      buyPriceKRW = Math.round(Number(price) * USD_TO_KRW);
    }

    const res = await axios.put(
      `http://localhost:5000/api/portfolio/${id}`,
      {
        quantity: Number(qty),
        buyPrice: buyPriceKRW
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );

    setList((prev) =>
      prev.map((i) => (i._id === id ? res.data : i))
    );

    setEditId(null);
    setQty("");
    setPrice("");
  };

  /* ===============================
     전체 요약 계산
  =============================== */
  const totalBuy = list.reduce(
    (sum, item) => sum + item.buyPrice * item.quantity,
    0
  );

  const totalEval = list.reduce((sum, item) => {
    const current = priceMap[item._id] || 0;
    return sum + current * item.quantity;
  }, 0);

  const totalProfit = totalEval - totalBuy;
  const totalRate =
    totalBuy > 0 ? ((totalProfit / totalBuy) * 100).toFixed(2) : 0;

  const isTotalPlus = totalProfit >= 0;

  /* ===============================
     차트 데이터
  =============================== */
  const pieData = list.map((item) => ({
    name: item.name,
    value: (priceMap[item._id] || 0) * item.quantity
  }));

  const COLORS = generateColors(pieData.length);

  if (loading) return <div className="portfolio-wrap">로딩 중...</div>;

  return (
    <div className="portfolio-wrap">
      <h1>MY PORTFOLIO</h1>

      {/* 자산 */}
      <div className="portfolio-summary dashboard-style">
      {/* 총 평가금액 */}
      <div className="summary-item">
        <span className="label">총 평가금액</span>
        <span
          className={`main-amount ${
            isTotalPlus ? "profit-plus" : "profit-minus"
          }`}
        >
          {Math.round(totalEval).toLocaleString()}원
        </span>
      </div>

      {/* 총 매수금액 */}
      <div className="summary-item">
        <span className="label">총 매수금액</span>
        <span className="buy-amount-fixed">
          {totalBuy.toLocaleString()}원
        </span>
      </div>

      {/* 총 손익 */}
      <div className="summary-item profit-box">
        <span className="label">총 손익</span>
        <span
          className={`profit-amount ${
            isTotalPlus ? "profit-plus" : "profit-minus"
          }`}
        >
          {isTotalPlus ? "▲ " : "▼ "}
          {Math.round(totalProfit).toLocaleString()}원 ({totalRate}%)
        </span>
      </div>
    </div>


      {/* 차트 */}
      <div className="portfolio-chart-wrap">
        <h3>보유자산</h3>

        <div className="portfolio-chart-row">
          {/* 왼쪽: 도넛 차트 */}
          <div className="chart-box">
            <ResponsiveContainer width={260} height={260}>
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  innerRadius={65}
                  outerRadius={100}
                  cx="50%"
                  cy="50%"
                  isAnimationActive={false}
                >
                  {pieData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={COLORS[i % COLORS.length]}
                    />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* 오른쪽: 비율 리스트 */}
          <div className="chart-legend">
            {pieData.map((item, i) => {
              const percent =
                totalEval > 0
                  ? ((item.value / totalEval) * 100).toFixed(1)
                  : 0;

              return (
                <div className="legend-row" key={i}>
                  <span
                    className="legend-dot"
                    style={{ backgroundColor: COLORS[i % COLORS.length] }}
                  />
                  <span className="legend-name">{item.name}</span>
                  <span className="legend-percent">{percent}%</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* 목록 */}
      {list.map((item) => {
        const current = priceMap[item._id] || 0;
        const buyTotal = item.buyPrice * item.quantity;
        const evalTotal = current * item.quantity;
        const profit = evalTotal - buyTotal;
        const rate = buyTotal > 0 ? ((profit / buyTotal) * 100).toFixed(2) : 0;
        const isPlus = profit >= 0;

        return (
          <div className="portfolio-card" key={item._id}>
            <div className="left">
              <strong>{item.name} ({item.symbol})</strong>
              <p>{item.market}</p>
            </div>

            {editId === item._id ? (
              <div className="edit-box">
                <div className="edit-field">
                  <label>수량</label>
                  <input
                    type="number"
                    value={qty}
                    onChange={(e) => setQty(e.target.value)}
                  />
                </div>

                <div className="edit-field">
                  <label>금액</label>
                  <input
                    type="number"
                    value={price}
                    placeholder={item.market === "US" ? "$" : "원"}
                    onChange={(e) => setPrice(e.target.value)}
                  />
                </div>

                <button className="save-btn" onClick={() => saveEdit(item._id)}>
                  저장
                </button>
                <button className="cancel-btn" onClick={() => setEditId(null)}>
                  취소
                </button>
              </div>  
            ) : (
              <div className="right">
                <span>보유: {item.quantity}</span>
                <span>매수가: {item.buyPrice.toLocaleString()}원</span>
                <span>
                  현재가:{" "}
                  <strong style={{ color: isPlus ? "#16a34a" : "#dc2626" }}>
                    {current.toLocaleString()}원
                  </strong>
                </span>
                <span>평가금액: {evalTotal.toLocaleString()}원</span>
                <span className={isPlus ? "profit plus" : "profit minus"}>
                  {isPlus ? "▲" : "▼"} {profit.toLocaleString()}원 ({rate}%)
                </span>
                <button className="edit-btn" onClick={() => startEdit(item)}>
                  수정
                </button>
                <button className="delete-btn" onClick={() => handleDelete(item._id)}>
                  삭제
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
