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

export default function Portfolio() {
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);

  const [editId, setEditId] = useState(null);
  const [qty, setQty] = useState("");
  const [price, setPrice] = useState("");

  // 🔥 현재가 저장 (id → price)
  const [priceMap, setPriceMap] = useState({});

  const token = localStorage.getItem("token");

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
  =============================== */
  useEffect(() => {
  if (!list.length) return;

  let timer;

  const fetchPrices = async () => {
    const prices = {};

    for (const item of list) {
      try {
        if (item.market === "CRYPTO") {
          // ✅ 업비트 현재가
          const data = await fetchCryptoPrice(item.symbol);
          prices[item._id] = data.price;
        } else {
          // ✅ 국내주식
          const res = await axios.get(
            `http://localhost:5000/api/stock/korea/${item.symbol}`
          );
          prices[item._id] = res.data.price;
        }
      } catch (e) {
        prices[item._id] = priceMap[item._id] || 0;
      }
    }

    setPriceMap(prices);
  };

    fetchPrices();                 // 최초 1회
    timer = setInterval(fetchPrices, 3000); // ⏱ 3초 폴링

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
     수정
  =============================== */
  const startEdit = (item) => {
    setEditId(item._id);
    setQty(item.quantity);
    setPrice(item.buyPrice);
  };

  const saveEdit = async (id) => {
    const res = await axios.put(
      `http://localhost:5000/api/portfolio/${id}`,
      { quantity: Number(qty), buyPrice: Number(price) },
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

  const COLORS = ["#22c55e", "#2563eb", "#f59e0b", "#ef4444", "#8b5cf6"];

  if (loading) return <div className="portfolio-wrap">로딩 중...</div>;

  return (
    <div className="portfolio-wrap">
      <h1>📊 내 포트폴리오</h1>

      {/* ===============================
          요약 카드
      =============================== */}
      <div className="portfolio-summary horizontal">
        <div className="summary-item">
          <span className="label">총 평가금액</span>
          <span className="value">
            {totalEval.toLocaleString()}원
          </span>
        </div>

        <div className="summary-item">
          <span className="label">총 매수금액</span>
          <span className="value muted">
            {totalBuy.toLocaleString()}원
          </span>
        </div>

        <div className="summary-item">
          <span
            className={`value ${
              isTotalPlus ? "profit-plus" : "profit-minus"
            }`}
          >
            {isTotalPlus ? "▲" : "▼"}{" "}
            {totalProfit.toLocaleString()}원 ({totalRate}%)
          </span>
        </div>
      </div>

      {/* ===============================
          비중 차트
      =============================== */}
      <div className="portfolio-chart">
        <h3>📌 포트폴리오 비중</h3>

        {pieData.length === 0 ? (
          <p>차트 데이터가 없습니다.</p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <PieChart>
              <Pie
                data={pieData}
                dataKey="value"
                nameKey="name"
                cx="50%"
                cy="50%"
                outerRadius={90}
                label
              >
                {pieData.map((_, index) => (
                  <Cell
                    key={index}
                    fill={COLORS[index % COLORS.length]}
                  />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* ===============================
          포트폴리오 목록
      =============================== */}
      {list.map((item) => {
        const current = priceMap[item._id] || 0;

        const buyTotal = item.buyPrice * item.quantity;
        const evalTotal = current * item.quantity;
        const profit = evalTotal - buyTotal;
        const rate =
          buyTotal > 0 ? ((profit / buyTotal) * 100).toFixed(2) : 0;

        const isPlus = profit >= 0;

        return (
          <div className="portfolio-card" key={item._id}>
            <div className="left">
              <strong>
                {item.name} ({item.symbol})
              </strong>
              <p>{item.market}</p>
            </div>

            {editId === item._id ? (
              <div className="edit-box">
                <input
                  type="number"
                  value={qty}
                  onChange={(e) => setQty(e.target.value)}
                />
                <input
                  type="number"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
                <button onClick={() => saveEdit(item._id)}>저장</button>
                <button onClick={() => setEditId(null)}>취소</button>
              </div>
            ) : (
              <div className="right">
                <span>보유: {item.quantity}</span>
                <span>매수가: {item.buyPrice.toLocaleString()}원</span>
                <span>
                  현재가:{" "}
                  <strong
                    style={{
                      color: isPlus ? "#16a34a" : "#dc2626"
                    }}
                  >
                    {current.toLocaleString()}원
                  </strong>
                </span>
                <span>평가금액: {evalTotal.toLocaleString()}원</span>

                <span className={isPlus ? "profit plus" : "profit minus"}>
                  {isPlus ? "▲" : "▼"} {profit.toLocaleString()}원 ({rate}%)
                </span>

                <button onClick={() => startEdit(item)}>수정</button>
                <button onClick={() => handleDelete(item._id)}>삭제</button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
