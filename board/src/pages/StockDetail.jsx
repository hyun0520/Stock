import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import AssetActions from "../components/AssetActions";
import "../styles/StockDetail.css";

export default function StockDetail() {
  const { symbol } = useParams();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");
  const [chart1y, setChart1y] = useState([]);

  const loaded1yRef = useRef(false); // 🔥 1y 중복 호출 방지

  /* ===============================
     국내주식 상세 정보
  =============================== */
  useEffect(() => {
    let mounted = true;

    async function fetchDetail() {
      try {
        const res = await api.get(`/stock/korea/${symbol}`);
        const data = Array.isArray(res.data)
          ? res.data[0]
          : res.data;

        mounted && setDetail(data);
      } catch (err) {
        console.error("korea stock detail error", err);
        mounted && setError("주식 정보를 불러오지 못했습니다.");
      } finally {
        mounted && setLoading(false);
      }
    }

    fetchDetail();
    return () => (mounted = false);
  }, [symbol]);

  /* ===============================
     관심종목 체크
  =============================== */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    async function checkWatchlist() {
      try {
        const res = await api.get("/watchlist");
        const exists = res.data.some(
          (item) => item.symbol === symbol && item.market === "KOREA"
        );
        setAdded(exists);
      } catch (err) {
        console.error("watchlist check failed", err);
      }
    }

    checkWatchlist();
  }, [symbol]);

  /* ===============================
    차트 범위별 데이터 필터
  =============================== */
  // const filterByRange = (data, range) => {
  //   if (!data.length) return data;

  //   const now = Date.now();

  //   const rangeMsMap = {
  //     "1d": 1 * 24 * 60 * 60 * 1000,
  //     "1w": 7 * 24 * 60 * 60 * 1000,
  //     "1m": 30 * 24 * 60 * 60 * 1000,
  //     "3m": 90 * 24 * 60 * 60 * 1000,
  //     "1y": 365 * 24 * 60 * 60 * 1000
  //   };

  //   const limitMs = rangeMsMap[range];
  //   if (!limitMs) return data;

  //   return data.filter(d => now - d.time <= limitMs);
  // };

  
  /* ===============================
     차트 요청 함수 (단일 진입점)
  =============================== */
  const fetchChartByRange = useCallback(
    async (range) => {
      try {
        const res = await api.get(
          `/stock/korea/${symbol}/chart`,
          { params: { range } }
        );
      return Array.isArray(res.data) ? res.data : [];
      } catch (err) {
        console.error("chart fetch error", err);
        return [];
      }
    },
    [symbol]
  );
  const addToWatchlist = async () => {
    try {
      await api.post("/watchlist", {
        symbol: detail.symbol,
        name: detail.name,
        market: "KOREA"
      });

      setAdded(true);
    } catch (err) {
      setError("이미 관심종목이거나 오류가 발생했습니다.");
    }
  };

  const addToPortfolio = async (qty, buy) => {
    if (!qty || !buy || Number(qty) <= 0 || Number(buy) <= 0) {
      return "보유 수량과 매수가를 올바르게 입력하세요.";
    }

    try {
      await api.post("/portfolio", {
        symbol: detail.symbol,
        name: detail.name,
        market: "KOREA",
        quantity: Number(qty),
        buyPrice: Number(buy)
      });

      return true;
    } catch (err) {
      return (
        err.response?.data?.message ||
        "이미 등록되었거나 오류가 발생했습니다."
      );
    }
  };

  /* ===============================
     🔥 52주 차트 지연 로딩 (초기 호출 ❌)
     - 페이지 안정화 후 1번만 실행
  =============================== */
  useEffect(() => {
    if (loaded1yRef.current) return;

    const timer = setTimeout(async () => {
      const data = await fetchChartByRange("1y");
      setChart1y(data);
      loaded1yRef.current = true;
    }, 8000); // 🔥 8초 후 (Yahoo 안전)

    return () => clearTimeout(timer);
  }, [fetchChartByRange]);

  /* ===============================
     52주 최고 / 최저
  =============================== */
  const { high52Calc, low52Calc } = useMemo(() => {
    if (!chart1y.length) {
      return { high52Calc: null, low52Calc: null };
    }

    const prices = chart1y.map(d => d.price);

    return {
      high52Calc: Math.max(...prices),
      low52Calc: Math.min(...prices)
    };
  }, [chart1y]);

  /* ===============================
     Render
  =============================== */
  if (loading) return <div style={{ padding: 40 }}>로딩 중...</div>;
  if (!detail) return <div style={{ padding: 40 }}>데이터 없음</div>;

  const {
    name,
    symbol: code,
    price,
    change,
    rate,
    prevPrice,
    open,
    high,
    low,
    volume
  } = detail;

  return (
    <div className="stock-container">
      <AssetActions
        name={name}
        symbol={code}
        marketLabel="국내주식"
        price={price}
        change={change}
        rate={rate}
        prevPrice={prevPrice}
        fetchChart={fetchChartByRange}
        defaultRange="1d"        
        chartColor="#ff8a00"
        market="KOREA"
        open={open}
        high={high}
        low={low}
        volume={volume}
        high52={high52Calc}
        low52={low52Calc}
        added={added}
        disabled={!price}
        onAddWatch={addToWatchlist}        
        onAddPortfolio={addToPortfolio}
      />
      {error && <p className="stock-error">{error}</p>}
    </div>
  );
}
