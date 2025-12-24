import { useState, useEffect } from "react";
import "../styles/AssetDetail.css";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  ReferenceLine
} from "recharts";

/* ===== 기간 탭 ===== */
const SHOW_YEAR_RANGES = ["3m", "1y", "5y"];

const RANGES = [
  { key: "1d", label: "1일" },
  { key: "1w", label: "1주" },
  { key: "1m", label: "1개월" },
  { key: "3m", label: "3개월" },
  { key: "1y", label: "1년" },
  { key: "5y", label: "5년" }
];

export default function AssetActions({
  name,
  symbol,
  marketLabel,
  price,
  change,
  rate,
  open,
  high,
  low,
  prevPrice,
  volume,
  high52,
  low52,
  added,
  disabled,
  onAddWatch,
  onAddPortfolio,
  fetchChart,
  chartColor = "#ff8a00",
  defaultRange = "1d",
  market = "KR"
}) {
  /* ===== Chart State ===== */
  const [range, setRange] = useState(defaultRange);
  const [chart, setChart] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!fetchChart) return;

    let mounted = true;
    setLoading(true);

    fetchChart(range)
      .then((data) => mounted && setChart(data || []))
      .finally(() => mounted && setLoading(false));

    return () => (mounted = false);
  }, [range, fetchChart]);

  /* ===== Modal ===== */
  const [modalOpen, setModalOpen] = useState(false);
  const [qty, setQty] = useState("");
  const [buy, setBuy] = useState("");
  const [msg, setMsg] = useState("");
  /* ================= Date Formatters ================= */
  const getUSMarketRangeKST = () => {
    const now = new Date();

    // 오늘 날짜 기준 KST
    const start = new Date(now);
    start.setHours(23, 30, 0, 0); // 23:30 KST

    const end = new Date(start);
    end.setDate(end.getDate() + 1);
    end.setHours(6, 0, 0, 0); // 다음날 06:00 KST

    return {
      min: start.getTime(),
      max: end.getTime()
    };
  };
  
const formatX = (v) => {
  const date = new Date(Number(v));
  if (Number.isNaN(date.getTime())) return "";

  // 시간대: US는 KST로 보여주고 싶다 했으니(지금 요구사항 기준)
  const tz = "Asia/Seoul";

  // 1일만 시간, 나머지는 날짜로
  if (range === "1d") {
    return date.toLocaleTimeString("en-US", {
      timeZone: tz,
      hour: "2-digit",
      minute: "2-digit",
      hour12: true
    });
  }

  // 1주 이상이면 날짜 (예: 12/23)
  return date
      .toLocaleDateString("en-CA", {
        timeZone: tz,
        year: SHOW_YEAR_RANGES.includes(range) ? "numeric" : undefined,
        month: "2-digit",
        day: "2-digit"
      })
      .replace(/-/g, "/");
  };

  const formatTooltipLabel = (value) => {
    const d = new Date(Number(value));
    if (Number.isNaN(d.getTime())) return "";

    // 1일만 시간 포함
    if (range === "1d") {
      return d.toLocaleString("en-US", {
        timeZone: "Asia/Seoul",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      });
    }

    // 1주 이상은 날짜만
    return d.toLocaleDateString("en-US", {
      timeZone: "Asia/Seoul",
      month: "2-digit",
      day: "2-digit"
    });
  };


  const format = (v) =>
    typeof v === "number" && !isNaN(v) ? v.toLocaleString() : "—";

  const isUp = change > 0;
  const isDown = change < 0;

  const handleConfirm = async () => {
  const result = await onAddPortfolio(qty, buy);

    if (result === true) {
      setMsg("등록되었습니다.");
      setTimeout(() => {
        setModalOpen(false);
        setQty("");
        setBuy("");
        setMsg("");
      }, 800);
    } else {
      setMsg(result || "오류가 발생했습니다.");
    }
  };

  return (
    <>
{/* ================= 종목 헤더 ================= */}
<section className="asset-header">
  <h1 className="asset-title">
    {name} <span>({symbol})</span>
  </h1>

  <p className="asset-sub">
    {marketLabel} · 최근 조회 기준
  </p>

  <div className="asset-price-row">
    <strong className="price">
      {price?.toLocaleString()}원
    </strong>

    <span
      className={`change ${
        change > 0 ? "up" : change < 0 ? "down" : ""
      }`}
    >
      {change > 0 && "▲ "}
      {change < 0 && "▼ "}
      {change?.toLocaleString()} ({rate}%)
    </span>
  </div>
</section>

{/* ================= 차트 ================= */}
      {fetchChart && (
          <section className="asset-chart">
            <div className="range-tabs">
              {RANGES.map((r) => (
                <button
                  key={r.key}
                  className={range === r.key ? "active" : ""}
                  onClick={() => setRange(r.key)}
                >
                  {r.label}
                </button>
              ))}
            </div>      
            <div className="chart-box" style={{ width: "100%", height: 260 }}>
              {loading ? (
                <div className="chart-loading">차트 로딩중...</div>
              ) : (
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chart}
                    margin={{ top: 6, right: 8, left: 16, bottom: 0 }}
                  >
                  <CartesianGrid stroke="#eee" strokeDasharray="3 3" />
                  <XAxis
                    dataKey="time"
                    type="number"
                    scale="time"
                    domain={["dataMin", "dataMax"]}
                    tickFormatter={formatX}
                    tick={{ fontSize: 11 }}
                    minTickGap={28}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    tick={{ fontSize: 11 }}
                    width={48}
                    domain={[
                      (min) => min * 0.995,
                      (max) => max * 1.005
                    ]}
                    tickFormatter={(v) => Math.round(v).toLocaleString()}
                  />

                  {typeof prevPrice === "number" && (
                    <ReferenceLine
                      y={prevPrice}
                      stroke="#74787dff"              
                      strokeDasharray="4 4"
                      ifOverflow="extendDomain"
                      label={({ viewBox }) => {
                        const { x, y } = viewBox;

                        const text = "전일가";

                        return (
                          <g>
                            {/* 배경 박스 */}
                            <rect
                              x={x - 45}              
                              y={y - 10}
                              rx={6}
                              ry={6}
                              width={text.length * 10 + 12}
                              height={20}
                              fill="#374151"         
                              stroke="#1f2937"
                              fillOpacity={1}
                            />
                            {/* 텍스트 */}
                            <text
                              x={x - 40}
                              y={y + 5}
                              fill="#ffffff"
                              fontSize={12}
                              fontWeight={700}
                            >
                              {text}
                            </text>
                          </g>
                        );
                      }}
                    />
                  )}
                  <Tooltip
                    content={
                      <PriceTooltip
                        range={range}
                        market={market}
                      />
                    }
                    cursor={{ stroke: "#d1d5db", strokeDasharray: "3 3" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="price"
                    stroke={chartColor}
                    strokeWidth={2}
                    dot={false}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </section>
      )}

      {/* ================= 시세 요약 ================= */}
      <section className="asset-summary">
        <SummaryRow label="현재가" value={format(price)} />
        <SummaryRow label="전일가" value={format(prevPrice)} />
        <SummaryRow
          label="전일대비"
          value={`${isUp ? "+" : ""}${format(change)} (${rate}%)`}
          className={isUp ? "up" : isDown ? "down" : ""}
        />
        <SummaryRow label="거래량" value={format(volume)} />
        <SummaryRow label="시가" value={format(open)} />
        <SummaryRow label="고가" value={format(high)} />
        <SummaryRow label="저가" value={format(low)} />
        <SummaryRow label="52주 최고" value={format(high52)} />
        <SummaryRow label="52주 최저" value={format(low52)} />
      </section>

      {/* ================= 버튼 ================= */}
      <section className="stock-actions">
        <button
          className={`watch-btn ${added ? "added" : ""}`}
          disabled={added || disabled}
          onClick={onAddWatch}
        >
          {added ? "관심종목 추가됨" : "관심종목 추가"}
        </button>

        <button
          className="portfolio-btn"
          disabled={disabled}
          onClick={() => setModalOpen(true)}
        >
          포트폴리오 추가
        </button>
      </section>

      {/* ================= 모달 ================= */}
      {modalOpen && (
        <>
          <div
            className="modal-overlay"
            onClick={() => setModalOpen(false)}
          />

          <div className="portfolio-modal">
            <h3 className="modal-title">포트폴리오 추가</h3>

            <div className="modal-field">
              <input
                type="number"
                placeholder="보유수량 입력"
                value={qty}
                onChange={(e) => setQty(e.target.value)}
              />
            </div>

            <div className="modal-field">
              <input
                type="number"
                placeholder="매수가(원) 입력"
                value={buy}
                onChange={(e) => setBuy(e.target.value)}
              />
            </div>

            {msg && (
              <div
                className={`portfolio-msg ${
                  msg.includes("등록") ? "success" : "error"
                }`}
              >
                {msg}
              </div>
            )}

            <div className="modal-actions">
              <button
                className="btn-cancel"
                onClick={() => setModalOpen(false)}
              >
                취소
              </button>
              <button
                className="btn-confirm"
                onClick={handleConfirm}
              >
                추가
              </button>
            </div>
          </div>
        </>
      )}

    </>
  );
}

function SummaryRow({ label, value, className }) {
  return (
    <div className={`summary-row ${className || ""}`}>
      <span className="label">{label}</span>
      <span>{value}</span>
    </div>
  );
}

function PriceTooltip({ active, payload, label, range, market }) {
  if (!active || !payload || !payload.length) return null;

  const date = new Date(label);

  const showTime = range === "1d"; 

  const dateText = showTime
    ? date.toLocaleString("en-CA", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true
      }).replace(/-/g, "/")
    : date.toLocaleDateString("en-CA", {
        year: SHOW_YEAR_RANGES.includes(range) ? "numeric" : undefined,
        month: "2-digit",
        day: "2-digit"
      }).replace(/-/g, "/");  
    
  const price =
    market === "US"
      ? `$${payload[0].value.toFixed(2)}`
      : `${payload[0].value.toLocaleString()}원`;

  return (
    <div className="chart-tooltip">
      <div className="tooltip-date">{dateText}</div>
      <div className="tooltip-price">가격: {price}</div>
    </div>
  );
}
