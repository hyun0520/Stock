import { api } from "../services/api";
import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import AssetActions from "../components/AssetActions";

export default function StockDetailUS() {
  const { symbol } = useParams();

  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);

  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");

  // 환율 (USD → KRW)
  const [usdRate, setUsdRate] = useState(1470);

  /* ===============================
    환율 로드 (공통 API)
  =============================== */
  useEffect(() => {
    const fetchFx = async () => {
      try {
        const res = await api.get("/fx");
        if (res.data?.USD?.rate) {
          setUsdRate(res.data.USD.rate);
        }
      } catch (e) {
        console.error("환율 로딩 실패", e);
      }
    };

    fetchFx();
    const timer = setInterval(fetchFx, 10 * 60 * 1000);
    return () => clearInterval(timer);
  }, []);

  /* ===============================
     🇺🇸 상세 정보 로드
  =============================== */
  useEffect(() => {
    let mounted = true;

    async function fetchDetail() {
      try {
        const res = await api.get(`/usStock/${symbol}`);
        if (!mounted) return;
        setDetail(res.data || null);
      } catch (err) {
        console.error("US stock detail error", err);
        setError("미국 주식 정보를 불러오지 못했습니다.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchDetail();
    return () => {
      mounted = false;
    };
  }, [symbol]);

  /* ===============================
     관심종목 체크
  =============================== */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    async function checkWatchlist() {
      try {
        const res = await api.get("/watchlist", {
          headers: { Authorization: `Bearer ${token}` }
        });

        const exists = res.data.some(
          (item) => item.symbol === symbol && item.market === "US"
        );

        setAdded(exists);
      } catch (err) {
        console.error("❌ watchlist check failed", err);
      }
    }

    checkWatchlist();
  }, [symbol]);

  /* ===============================
    차트 fetch (AssetActions)
  =============================== */
  const fetchChartByRange = useCallback(
    async (range) => {
      try {
        const res = await api.get(
          `/usStock/${symbol}/chart`,
          { params: { range } }
        );

        if (!Array.isArray(res.data)) return [];

        // 🔥 AssetActions 전용 포맷으로 변환
        return res.data
          .map((d) => ({
            time: new Date(d.date).getTime(), // XAxis용
            price: d.close                    // Line용
          }))
          .filter((d) => !Number.isNaN(d.time));
      } catch (e) {
        console.error("❌ US chart fetch failed", e);
        return [];
      }
    },
    [symbol]
  );

  /* ===============================
    계산값
  =============================== */
  const price =
    typeof detail?.price === "number" && detail.price > 0
      ? detail.price
      : 0;

  const rate =
    typeof detail?.rate === "number"
      ? detail.rate
      : 0;

  const diff =
    rate !== 0
      ? Number((price * (rate / 100)).toFixed(2))
      : 0;

  const isUp = diff > 0;
  const isDown = diff < 0;

  /* ===============================
    관심종목 추가
  =============================== */
  const addToWatchlist = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("로그인이 필요합니다.");
        return;
      }

      await api.post(
        "/watchlist",
        {
          symbol: detail.symbol,
          name: detail.name || detail.symbol,
          market: "US"
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setAdded(true);
      setError("");
    } catch {
      setError("이미 관심종목이거나 오류가 발생했습니다.");
    }
  };

  /* ===============================
     포트폴리오 추가
  =============================== */
  const addToPortfolio = async (qty, buy) => {
    const token = localStorage.getItem("token");
    if (!token) return "로그인이 필요합니다.";

    if (!qty || !buy || Number(qty) <= 0 || Number(buy) <= 0) {
      return "보유 수량과 매수가를 올바르게 입력하세요.";
    }

    try {
      const buyPriceKRW = Math.round(Number(buy) * usdRate);

      await api.post(
        "/portfolio",
        {
          symbol: detail.symbol,
          name: detail.name || detail.symbol,
          market: "US",
          quantity: Number(qty),
          buyPrice: buyPriceKRW
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      return true;
    } catch (err) {
      return (
        err.response?.data?.message ||
        "이미 등록되었거나 오류가 발생했습니다."
      );
    }
  };

  /* ===============================
     Render
  =============================== */
  if (loading) return <div style={{ padding: 40 }}>로딩 중...</div>;
  if (!detail) return <div style={{ padding: 40 }}>데이터 없음</div>;

  return (
    <div className="stock-container">
      <AssetActions
        name={detail.name}
        symbol={detail.symbol}
        marketLabel="미국주식"
        price={price}
        change={diff}
        rate={rate}
        prevPrice={detail.prevPrice}
        fetchChart={fetchChartByRange}
        chartColor="#ff8a00"
        market="US"
        defaultRange="1d"
        open={detail.open}
        high={detail.high}
        low={detail.low}
        volume={detail.volume}
        high52={detail.high52}
        low52={detail.low52}
        added={added}
        disabled={price <= 0}
        onAddWatch={addToWatchlist}
        onAddPortfolio={addToPortfolio}
      />

      {error && <p className="stock-error">{error}</p>}
    </div>
  );

}
