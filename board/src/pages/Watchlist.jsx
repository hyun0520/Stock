import { useEffect, useState } from "react";
import { api } from "../services/api";
import { useNavigate } from "react-router-dom";
import "../styles/Watchlist.css";

const USD_TO_KRW = 1474;

export default function Watchlist() {
  const [list, setList] = useState([]);
  const [prices, setPrices] = useState({});
  const [rateMap, setRateMap] = useState({});
  const [prevPrices, setPrevPrices] = useState({});
  const [loading, setLoading] = useState(true);

  const token = localStorage.getItem("token");
  const navigate = useNavigate();

  /* ===============================
     관심종목 불러오기
  =============================== */
  const fetchWatchlist = async () => {
    const res = await api.get("/api/watchlist", {
      headers: { Authorization: `Bearer ${token}` }
    });
    setList(res.data);
    return res.data;
  };

  /* ===============================
     현재가 + 등락률
  =============================== */
  const fetchPrices = async (items) => {
    const priceTemp = {};
    const rateTemp = {};
    const oldPrices = { ...prices };

    await Promise.all(
      items.map(async (item) => {
        try {
          /* ===== CRYPTO ===== */
          if (item.market === "CRYPTO") {
            const res = await api.get("/api/search/price", {
              params: {
                type: "CRYPTO",
                symbol: item.symbol
              }
            });

            priceTemp[item.symbol] = res.data.price;
            rateTemp[item.symbol] = res.data.changeRate ?? null;
          }

          /* ===== US ===== */
          else if (item.market === "US") {
            const res = await api.get(`/api/usStock/${item.symbol}`);

            const krw = Math.round(res.data.price * USD_TO_KRW);
            priceTemp[item.symbol] = krw;
            rateTemp[item.symbol] = res.data.rate;
          }

          /* ===== KOREA ===== */
          else {
            const res = await api.get(`/api/stock/korea/${item.symbol}`);

            priceTemp[item.symbol] = res.data.price;
            rateTemp[item.symbol] = res.data.rate ?? null;
          }
        } catch (err) {
          priceTemp[item.symbol] = oldPrices[item.symbol] || 0;
          rateTemp[item.symbol] = null;
        }
      })
    );

    setPrevPrices(oldPrices);
    setPrices(priceTemp);
    setRateMap(rateTemp);
  };

  /* ===============================
     초기 로드 + 실시간 폴링
     (CRYPTO / KOREA / US 동일)
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

    if (token) init();
    return () => clearInterval(timer);
  }, [token]);

  /* ===============================
     삭제
  =============================== */
  const removeItem = async (id) => {
    await api.delete(`/api/watchlist/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    });

    setList((prev) => prev.filter((i) => i._id !== id));
  };

  if (loading) return <div style={{ padding: 40 }}>로딩 중...</div>;

  return (
    <div className="watchlist-wrap">
      <h1 style={{ marginBottom: 20 }}>MY LIST</h1>

      {list.map((item) => {
        const current = prices[item.symbol] || 0;
        const apiRate = rateMap[item.symbol];

        let diff = 0;
        let rate = 0;

        if (apiRate !== null && apiRate !== undefined) {
          rate = apiRate;
          diff = Math.round(current * (rate / 100));
        } else {
          const prev = prevPrices[item.symbol];
          if (prev) {
            diff = current - prev;
            rate = ((diff / prev) * 100).toFixed(2);
          }
        }

        const isUp = diff > 0;
        const isDown = diff < 0;
        const changeClass =
          isUp ? "price-rise" : isDown ? "price-fall" : "";

        return (
          <div
            key={item._id}
            className="watch-card"
            onClick={() => {
              if (item.market === "CRYPTO") {
                navigate(`/crypto/${item.symbol}`);
              } else if (item.market === "US") {
                navigate(`/stock/us/${item.symbol}`);
              } else {
                navigate(`/stock/korea/${item.symbol}`);
              }
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

              <div className={`change ${changeClass}`}>
                {isUp && "▲ "}
                {isDown && "▼ "}
                {diff >= 0 ? "+" : ""}
                {diff.toLocaleString()}원 ({Number(rate).toFixed(2)}%)
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
