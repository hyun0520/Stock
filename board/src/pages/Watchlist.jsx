import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import "./Watchlist.css"; // 🔥 애니메이션 CSS

export default function Watchlist() {
  const [list, setList] = useState([]);
  const [prices, setPrices] = useState({});
  const [prevPrices, setPrevPrices] = useState({});
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  /* ===============================
     관심종목 불러오기
  =============================== */
  const fetchWatchlist = async () => {
    const res = await axios.get(
      "http://localhost:5000/api/watchlist",
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setList(res.data);
    return res.data;
  };

  /* ===============================
     현재가 불러오기 (주식 + 코인)
  =============================== */
  const fetchPrices = async (items) => {
    const priceMap = {};
    const oldPrices = { ...prices };

    await Promise.all(
      items.map(async (item) => {
        try {
          if (item.market === "CRYPTO") {
            const res = await axios.get(
              `http://localhost:5000/api/crypto/price/${item.symbol}`
            );
            priceMap[item.symbol] = res.data.price;
          } else {
            const res = await axios.get(
              `http://localhost:5000/api/stock/korea/${item.symbol}`
            );
            priceMap[item.symbol] = res.data.price;
          }
        } catch {
          priceMap[item.symbol] = oldPrices[item.symbol] || 0;
        }
      })
    );

    setPrevPrices(oldPrices);
    setPrices(priceMap);
  };

  /* ===============================
     초기 로딩 + 3초 폴링
  =============================== */
  useEffect(() => {
    let timer;

    async function init() {
      const items = await fetchWatchlist();
      await fetchPrices(items);
      setLoading(false);

      timer = setInterval(() => {
        fetchPrices(items);
      }, 3000);
    }

    init();
    return () => clearInterval(timer);
  }, []);

  /* ===============================
     삭제
  =============================== */
  const removeItem = async (id) => {
    await axios.delete(
      `http://localhost:5000/api/watchlist/${id}`,
      { headers: { Authorization: `Bearer ${token}` } }
    );
    setList((prev) => prev.filter((i) => i._id !== id));
  };

  if (loading) return <div style={{ padding: 40 }}>로딩 중...</div>;

  return (
    <div style={{ padding: 40, maxWidth: 1000, margin: "0 auto" }}>
      <h1 style={{ marginBottom: 20 }}>⭐ 내 관심종목</h1>

      {list.map((item) => {
        const current = prices[item.symbol] || 0;
        const prev = prevPrices[item.symbol];

        const changeClass =
          prev === undefined
            ? ""
            : current > prev
            ? "price-rise"
            : current < prev
            ? "price-fall"
            : "";

        return (
          <div
            key={item._id}
            className="watch-card"
            onClick={() => {
              item.market === "CRYPTO"
                ? navigate(`/crypto/${item.symbol}`)
                : navigate(`/stock/korea/${item.symbol}`);
            }}
          >
            {/* 왼쪽 */}
            <div>
              <div className="name">
                {item.name} ({item.symbol})
              </div>
              <div className="market">{item.market}</div>
            </div>

            {/* 오른쪽 */}
            <div className="right">
              <div className={`price ${changeClass}`}>
                {current.toLocaleString()}원
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  removeItem(item._id);
                }}
                className="delete-btn"
              >
                삭제
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
