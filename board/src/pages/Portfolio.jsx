import { useEffect, useState } from "react";
import { api } from "../services/api";
import "../styles/Portfolio.css";
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
  const [price, setPrice] = useState("");
  const [selectedItem, setSelectedItem] = useState(null);
  const [priceMap, setPriceMap] = useState({});
  // 모바일 전용 수정 상태
  const [mobileEdit, setMobileEdit] = useState(false);
  const [mobileQty, setMobileQty] = useState("");
  const [mobilePrice, setMobilePrice] = useState("");

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

    api
      .get("/portfolio", {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then((res) => setList(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [token]);

  /* ===============================
     현재가 불러오기
  =============================== */
  useEffect(() => {
    if (!list.length) return;

    const fetchPrices = async () => {
      const prices = {};

      for (const item of list) {
        try {
          if (item.market === "CRYPTO") {
            const data = await fetchCryptoPrice(item.symbol);
            prices[item._id] = data.price;

          } else if (item.market === "US") {
            const res = await api.get(`/usStock/${item.symbol}`);
            const usd = res.data.price || 0;
            prices[item._id] = Math.round(usd * USD_TO_KRW);

          } else {
            const res = await api.get(`/stock/korea/${item.symbol}`);
            prices[item._id] = res.data.price || 0;
          }
        } catch {
          prices[item._id] = priceMap[item._id] || 0;
        }
      }

      setPriceMap(prices);
    };

    fetchPrices();
    const timer = setInterval(fetchPrices, 3000);
    return () => clearInterval(timer);
  }, [list]);

  /* ===============================
     삭제
  =============================== */
  const handleDelete = async (id) => {
    if (!window.confirm("정말 삭제하시겠습니까?")) return;

    await api.delete(`/portfolio/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    setList((prev) => prev.filter((i) => i._id !== id));
  };

  /* ===============================
     수정 시작
  =============================== */
  const startEdit = (item) => {
    setEditId(item._id);
    setQty(item.quantity);

    if (item.market === "US") {
      setPrice((item.buyPrice / USD_TO_KRW).toFixed(2)); // $
    } else {
      setPrice(item.buyPrice);
    }
  };

  /* ===============================
     수정 저장
  =============================== */
  const saveEdit = async (id) => {
    const item = list.find((i) => i._id === id);
    if (!item) return;

    let buyPriceKRW = Number(price);
    if (item.market === "US") {
      buyPriceKRW = Math.round(Number(price) * USD_TO_KRW);
    }

    const res = await api.put(
      `/portfolio/${id}`,
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

      {/* ===== 요약 ===== */}
      <div className="portfolio-summary dashboard-style">
        <div className="summary-item">
          <span className="label">총 평가금액</span>
          <span className={`main-amount ${isTotalPlus ? "profit-plus" : "profit-minus"}`}>
            {Math.round(totalEval).toLocaleString()}원
          </span>
        </div>

        <div className="summary-item">
          <span className="label">총 매수금액</span>
          <span className="buy-amount-fixed">
            {totalBuy.toLocaleString()}원
          </span>
        </div>

        <div className="summary-item profit-box">
          <span className="label">총 손익</span>
          <span className={`profit-amount ${isTotalPlus ? "profit-plus" : "profit-minus"}`}>
            {isTotalPlus ? "▲ " : "▼ "}
            {Math.round(totalProfit).toLocaleString()}원 ({totalRate}%)
          </span>
        </div>
      </div>

      {/* ===== 차트 ===== */}
      <div className="portfolio-chart-wrap">
        <h3>보유자산</h3>

        <div className="portfolio-chart-row">
          <div className="chart-box">
            <ResponsiveContainer width={290} height={290}>
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
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>

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

      {/* ===== 목록 ===== */}
      {list.map((item) => {
        const current = priceMap[item._id] || 0;
        const buyTotal = item.buyPrice * item.quantity;
        const evalTotal = current * item.quantity;
        const profit = evalTotal - buyTotal;
        const rate = buyTotal > 0 ? ((profit / buyTotal) * 100).toFixed(2) : 0;
        const isPlus = profit >= 0;

        return (
          <div
            className="portfolio-card"
            key={item._id}
            onClick={() => setSelectedItem(item)}
          >
            {/* ===============================
                모바일 전용 
            =============================== */}
              <div className="mobile-only mobile-card">
                {/* 왼쪽 */}
                <div className="mobile-left">
                  <div className="name">{item.name}</div>
                  <div className="qty">{item.quantity}주</div>
                </div>

                {/* 오른쪽 */}
                <div className="mobile-right">
                  <div className="price">{evalTotal.toLocaleString()}원</div>
                  <div className={`profit ${isPlus ? "plus" : "minus"}`}>
                    {profit.toLocaleString()}원
                    <span className="rate"> ({rate}%)</span>
                  </div>
                </div>
              </div>
              
            {/* ===============================
                PC 전용 (기존 UI 유지)
            =============================== */}
            <div className="pc-only">
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
                    현재가: <strong>{current.toLocaleString()}원</strong>
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
          </div>
        );
      })}
      {selectedItem && (() => {
        const current = priceMap[selectedItem._id] || 0;
        const evalTotal = current * selectedItem.quantity;
        const buyTotal = selectedItem.buyPrice * selectedItem.quantity;
        const profit = evalTotal - buyTotal;
        const rate =
          buyTotal > 0 ? ((profit / buyTotal) * 100).toFixed(2) : 0;
        const isPlus = profit >= 0;

        return (
          <div
            className="detail-overlay mobile-only"
            onClick={() => setSelectedItem(null)}
          >
            <div
              className="detail-modal"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                className="detail-close"
                onClick={() => setSelectedItem(null)}
              >
                x
              </button>

              <h2>잔고내역 상세</h2>

              {/* 종목명 */}
              <div className="detail-header">
                <strong>
                  {selectedItem.name} ({selectedItem.symbol})
                </strong>
              </div>

              <div className="detail-row">
                <span>보유수량</span>
                <span>{selectedItem.quantity}주</span>
              </div>

              <div className="detail-row">
                <span>매수가</span>
                <span>{selectedItem.buyPrice.toLocaleString()}원</span>
              </div>

              <div className="detail-row">
                <span>현재가</span>
                <span>{current.toLocaleString()}원</span>
              </div>

              <div className="detail-row">
                <span>평가금액</span>
                <span>{evalTotal.toLocaleString()}원</span>
              </div>

              <div className={`detail-row profit ${isPlus ? "plus" : "minus"}`}>
                <span>평가손익</span>
                <span>
                  {isPlus ? "▲ " : "▼ "}
                  {profit.toLocaleString()}원 ({rate}%)
                </span>
              </div>
              {/* ===== 액션 버튼 ===== */}
              <div className="detail-actions">
                <button
                  className="detail-btn edit"
                onClick={(e) => {
                  e.stopPropagation();
                  setMobileEdit(true);
                  setMobileQty(selectedItem.quantity);
                  setMobilePrice(selectedItem.buyPrice);
                }}
                >
                  수정
                </button>

                <button
                  className="detail-btn delete"
                  onClick={() => {
                    setSelectedItem(null);
                    handleDelete(selectedItem._id);
                  }}
                >
                  삭제
                </button>
              </div>
              {mobileEdit && (
                <div className="mobile-edit-box edit-sheet">
                  <div className="edit-grid">
                    <div className="edit-field">
                      <label>수량</label>
                      <input
                        type="number"
                        value={mobileQty}
                        onChange={(e) => setMobileQty(e.target.value)}
                      />
                    </div>

                    <div className="edit-field">
                      <label>매수가</label>
                      <input
                        type="number"
                        value={mobilePrice}
                        onChange={(e) => setMobilePrice(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="edit-actions">
                      <button
                        className="save-btn"
                        onClick={async () => {
                          await api.put(
                            `/portfolio/${selectedItem._id}`,
                            {
                              quantity: Number(mobileQty),
                              buyPrice: Number(mobilePrice)
                            },
                            { headers: { Authorization: `Bearer ${token}` } }
                          );

                          setList((prev) =>
                            prev.map((i) =>
                              i._id === selectedItem._id
                                ? {
                                    ...i,
                                    quantity: Number(mobileQty),
                                    buyPrice: Number(mobilePrice)
                                  }
                                : i
                            )
                          );

                          setMobileEdit(false);
                          setSelectedItem(null);
                        }}
                      >
                        저장
                      </button>
                      <button
                        className="cancel-btn"
                        onClick={() => setMobileEdit(false)}
                      >
                        취소
                      </button>
                  </div>
                </div>
              )}



            </div>
          </div>
        );
      })()}
    </div>
  );
}
