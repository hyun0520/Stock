import { api } from "../services/api";
import "../styles/Dashboard.css";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { fetchCryptoPrice } from "../services/crypto";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer
} from "recharts";

/* ===== fallback ===== */
const marketData = [
  { time: "09:00", value: 2600 },
  { time: "10:00", value: 2620 }
];

const USD_TO_KRW = 1474;

/* 서버 market 값 그대로 대응 */
const normalizeMarket = (market) => {
  if (market === "KOREA") return "KR";
  return market;
};

export default function Dashboard() {
  const navigate = useNavigate();

  /* ================= MARKET ================= */
  const [kospi, setKospi] = useState([]);
  const [kosdaq, setKosdaq] = useState([]);
  const [nasdaq, setNasdaq] = useState([]);
  const [sp500, setSp500] = useState([]);

  /* ================= PORTFOLIO ================= */
  const [portfolio, setPortfolio] = useState([]);
  const [priceMap, setPriceMap] = useState({});

  const [totalAsset, setTotalAsset] = useState(0);
  const [totalProfit, setTotalProfit] = useState(0);
  const [totalRate, setTotalRate] = useState(0);
  /* ================= Asset present ================= */
  const formatKRW = (value) => {
    if (typeof value !== "number") return "-";
    return `${value.toLocaleString()}원`;
  };
  /* ================= FX ================= */
  const [fx, setFx] = useState(null);

  /* ================= INDEX ================= */
  useEffect(() => {
    api.get("/market/index/kospi")
      .then(res => setKospi(res.data))
      .catch(() => setKospi(marketData));

    api.get("/market/index/kosdaq")
      .then(res => setKosdaq(res.data))
      .catch(() => setKosdaq(marketData));

    api.get("/market/index/nasdaq")
      .then(res => setNasdaq(res.data))
      .catch(() => setNasdaq(marketData));

    api.get("/market/index/sp500")
      .then(res => setSp500(res.data))
      .catch(() => setSp500(marketData));
  }, []);

  /* ================= PORTFOLIO LOAD ================= */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    api.get("/portfolio", {
      headers: { Authorization: `Bearer ${token}` }
    }).then(res => setPortfolio(res.data));
  }, []);

  
  /* ================= CURRENT PRICE ================= */
  useEffect(() => {
    if (!portfolio.length) return;

    const fetchPrices = async () => {
      const prices = {};

      for (const item of portfolio) {
        const market = normalizeMarket(item.market);

        try {
          if (market === "CRYPTO") {
            const data = await fetchCryptoPrice(item.symbol);
            prices[item._id] = data.price;
          } 
          else if (market === "US") {
            const res = await api.get(`/usStock/${item.symbol}`);
            prices[item._id] =
              Math.round((res.data.price || 0) * USD_TO_KRW);
          } 
          else {
            const res = await api.get(`/stock/korea/${item.symbol}`);
            prices[item._id] = res.data.price || 0;
          }
        } catch (e) {
          console.error("가격 로딩 실패:", item.symbol, e);
          prices[item._id] = item.buyPrice || 0;
        }
      }

      setPriceMap(prices);
    };

    fetchPrices();
    const timer = setInterval(fetchPrices, 3000);
    return () => clearInterval(timer);
  }, [portfolio]);

  /* ================= TOTAL CALC ================= */
  useEffect(() => {
    if (!portfolio.length) return;

    let buyTotal = 0;
    let evalTotal = 0;

    portfolio.forEach(item => {
      const current = priceMap[item._id] ?? item.buyPrice;
      buyTotal += item.buyPrice * item.quantity;
      evalTotal += current * item.quantity;
    });

    const profit = evalTotal - buyTotal;
    const rate = buyTotal > 0 ? (profit / buyTotal) * 100 : 0;

    setTotalAsset(evalTotal);
    setTotalProfit(profit);
    setTotalRate(rate);
  }, [priceMap, portfolio]);

  /* ================= FX LOAD ================= */
  useEffect(() => {
    const fetchFx = async () => {
      try {
        const res = await api.get("/fx");
        setFx(res.data);
      } catch (e) {
        console.error("환율 로딩 실패", e);
      }
    };

    fetchFx();
    const timer = setInterval(fetchFx, 600000); // 10분
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="dashboard-wrap">

      {/* ===== MARKET ===== */}
      <section className="market-section">
        <h2>MARKET INDEX</h2>
        <div className="market-grid">
          <MarketChart title="KOSPI" data={kospi} />
          <MarketChart title="KOSDAQ" data={kosdaq} />
          <MarketChart title="NASDAQ" data={nasdaq} />
          <MarketChart title="S&P 500" data={sp500} />
        </div>
      </section>

      {/* ===== MOBILE MARKET ===== */}
      <section className="market-mobile-wrap">
        <h2 className="market-mobile-title">MARKET INDEX</h2>
        <div className="market-mobile">
          <MarketRow title="S&P 500" data={sp500} />
          <MarketRow title="NASDAQ" data={nasdaq} />
          <MarketRow title="KOSPI" data={kospi} />
          <MarketRow title="KOSDAQ" data={kosdaq} />
        </div>
      </section>

      {/* ===== ASSET ===== */}
      <section className="asset-section">
        <div className="asset-left">

          <div className="asset-card">
            <span className="label">총 자산</span>
              <strong className="value">
                {formatKRW(totalAsset)}
              </strong>
            <span className={`sub ${totalProfit >= 0 ? "plus" : "minus"}`}>
              총 손익 {totalProfit >= 0 ? "+" : ""}
              {formatKRW(totalProfit)} ({totalRate.toFixed(2)}%)
            </span>
          </div>

          <div
            className="portfolio-mini clickable"
            onClick={() => navigate("/portfolio")}
          >
            <h3>MY PORTFOLIO</h3>

            {portfolio.slice(0, 5).map(item => {
              const current = priceMap[item._id] ?? item.buyPrice;
              const evalAmount = current * item.quantity;
              const rate =
                item.buyPrice > 0
                  ? ((current - item.buyPrice) / item.buyPrice) * 100
                  : 0;

              return (
                <div key={item._id} className="portfolio-mini-row">
                  <span className="name">{item.name}</span>
                  <span className="eval">{formatKRW(evalAmount)}</span>
                  <span className={`rate ${rate >= 0 ? "plus" : "minus"}`}>
                    {rate >= 0 ? "▲" : "▼"} {Math.abs(rate).toFixed(2)}%
                  </span>
                </div>
              );
            })}

            {portfolio.length > 5 && (
              <div className="portfolio-more">
                내 포트폴리오 더보기…
              </div>
            )}
          </div>
        </div>

        <div className="asset-right">
          <TopList
            title="TOP GAINERS"
            url="/market/korea/top-gainers"
            type="up"
          />
          <TopList
            title="TOP LOSERS"
            url="/market/korea/top-losers"
            type="down"
          />
        </div>
      </section>

      {/* ===== FX ===== */}
      <section className="fx-section">
        <h2>EXCHANGE RATE</h2>
        <div className="fx-grid">
          <FxCard
            title="미국 USD"
            value={fx ? fx.USD.rate.toLocaleString() : "-"}
            diff={fx ? fx.USD.change : 0}
          />
          <FxCard
            title="일본 JPY 100"
            value={fx ? fx.JPY.rate.toLocaleString() : "-"}
            diff={fx ? fx.JPY.change : 0}
          />
          <FxCard
            title="캐나다 CAD"
            value={fx ? fx.CAD.rate.toLocaleString() : "-"}
            diff={fx ? fx.CAD.change : 0}
          />
          <FxCard
            title="유럽 EUR"
            value={fx ? fx.EUR.rate.toLocaleString() : "-"}
            diff={fx ? fx.EUR.change : 0}
          />
        </div>
      </section>
    </div>
  );
}

/* ================= COMPONENTS ================= */

function MarketChart({ title, data }) {
  if (!data || !data.chart?.length) return null;

  const { price, diff, rate, chart } = data;
  const isUp = diff >= 0;

  return (
    <div className="market-card">
      <h3>{title}</h3>

      <div className="market-price-strong">
        <span className={`main-price ${isUp ? "up" : "down"}`}>
          {price.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </span>

        <span className={`price-diff ${isUp ? "up" : "down"}`}>
          {isUp ? "▲" : "▼"}{" "}
          {Math.abs(diff).toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}{" "}
          ({rate.toFixed(2)}%)
        </span>
      </div>

      <ResponsiveContainer width="100%" height={180}>
        <LineChart data={chart}>
          <XAxis
            dataKey="time"
            tickFormatter={(v) =>
              new Date(v).toLocaleTimeString("en-US", {
                hour: "2-digit",
                minute: "2-digit",
                hour12: true
              })
            }
          />
          <YAxis domain={["auto", "auto"]} />

          <Tooltip
            content={({ active, payload, label }) => {
              if (!active || !payload || !payload.length) return null;

              const date = new Date(label);
              const timeText = date.toLocaleString("ko-KR", {
                hour: "2-digit",
                minute: "2-digit"
              });

              const value = payload[0].value;

              return (
                <div
                  style={{
                    background: "#ffffff",
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    padding: "8px 10px",
                    fontSize: 13
                  }}
                >
                  <div>{timeText}</div>
                  <div style={{ fontWeight: 600, color: "#f97316" }}>
                    Value:{" "}
                    {Number(value).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}
                  </div>
                </div>
              );
            }}
          />

          <Line
            dataKey="value"
            dot={false}
            stroke="#f97316"
            strokeWidth={2.5}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}


function TopList({ title, url, type }) {
  const navigate = useNavigate();
  const [list, setList] = useState([]);

  useEffect(() => {
    api
      .get(url)
      .then(res => setList(res.data))
      .catch(err => console.error(err));
  }, [url]);

  const getSymbol = (item) =>
    item.symbol || item.code || item.ticker || "";

  return (
    <div className="top-card">
      <h4>{title}</h4>
      {list.map((item, index) => {
        const symbol = getSymbol(item);
        return (
          <div
            key={index}
            className={`top-item ${symbol ? "clickable" : ""}`}
            onClick={
              symbol ? () => navigate(`/stock/korea/${symbol}`) : undefined
            }
          >
            <span>{item.name}</span>
            <span className={type === "up" ? "plus" : "minus"}>
              {item.rate}
            </span>
          </div>
        );
      })}
    </div>
  );
}


function FxCard({ title, value, diff }) {
  const isUp = diff >= 0;

  return (
    <div className="fx-card">
      <span className="fx-title">{title}</span>

      {/* 🔥 숫자 + 등락률 묶기 */}
      <div className="fx-main">
        <strong>{value}</strong>
        <span className={isUp ? "plus" : "minus"}>
          {isUp ? "▲" : "▼"} {Math.abs(diff).toFixed(2)}%
        </span>
      </div>
    </div>
  );
}

/* ================= 모바일용 ================= */
function MarketRow({ title, data }) {
  if (!data || !data.chart?.length) return null;

  const { price, diff, rate, chart } = data;
  const isUp = diff >= 0;

  return (
    <div className="market-mini-card">
      <span className="market-name">{title}</span>

      <strong className={`market-value ${isUp ? "up" : "down"}`}>
        {price.toLocaleString()}
      </strong>

      <span className={`market-rate ${isUp ? "up" : "down"}`}>
        {isUp ? "+" : ""}{rate.toFixed(2)}%
      </span>

      <ResponsiveContainer width="100%" height={36}>
        <LineChart data={chart}>
          <Line
            dataKey="value"
            dot={false}
            stroke={isUp ? "#16a34a" : "#dc2626"}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

function MarketTooltip({ active, payload, label }) {
  if (!active || !payload || !payload.length) return null;

  const value = payload[0].value;

  return (
    <div
      style={{
        background: "#ffffff",
        borderRadius: 10,
        padding: "10px 14px",
        boxShadow: "0 8px 20px rgba(0,0,0,0.12)",
        fontSize: 13
      }}
    >
      <div style={{ color: "#6b7280", marginBottom: 6 }}>
        {label}
      </div>

      <div style={{ color: "#f97316", fontWeight: 700 }}>
        Value:{" "}
        {Number(value).toLocaleString(undefined, {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })}
      </div>
    </div>
  );
}
