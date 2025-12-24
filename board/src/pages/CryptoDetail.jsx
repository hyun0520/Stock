import { useEffect, useState, useCallback } from "react";
import { useParams } from "react-router-dom";
import { api } from "../services/api";
import AssetActions from "../components/AssetActions";

export default function CryptoDetail() {
  const { market } = useParams();
  const [detail, setDetail] = useState(null);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [error, setError] = useState("");
  const [prevPrice, setPrevPrice] = useState(null);

  /* ===============================
     코인 전일가 정보
  =============================== */
  useEffect(() => {
    let mounted = true;

    async function fetchPrevPrice() {
      try {
        const res = await api.get(
          `/crypto/candles/${market}`,
          { params: { range: "1d", limit: 2 } }
        );

        if (!mounted) return;

        // 두 번째 캔들이 전일 종가
        if (Array.isArray(res.data) && res.data.length >= 2) {
          setPrevPrice(res.data[1].trade_price);
        }
      } catch (e) {
        console.error("prevPrice fetch failed", e);
      }
    }

    fetchPrevPrice();
    return () => (mounted = false);
  }, [market]);

  /* ===============================
     코인 상세 정보
  =============================== */
  useEffect(() => {
    let mounted = true;

    async function fetchDetail() {
      try {
        const res = await api.get(`/crypto/detail/${market}`);
        if (!mounted) return;
        setDetail(res.data);
        setError("");
      } catch (err) {
        console.error("crypto detail error", err);
        if (mounted) setError("코인 정보를 불러오지 못했습니다.");
      } finally {
        if (mounted) setLoading(false);
      }
    }

    fetchDetail();
    return () => {
      mounted = false;
    };
  }, [market]);

  /* ===============================
    이미 관심종목인지 체크
  =============================== */
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    async function checkWatchlist() {
      try {
        const res = await api.get("/watchlist", {
          headers: { Authorization: `Bearer ${token}` }
        });

        const exists = Array.isArray(res.data)
          ? res.data.some(
              (item) => item.symbol === market && item.market === "CRYPTO"
            )
          : false;

        setAdded(exists);
      } catch (err) {
        console.error("watchlist check failed", err);
      }
    }

    checkWatchlist();
  }, [market]);

  /* ===============================
    차트 데이터
  =============================== */
  const fetchChartByRange = useCallback(
    async (range) => {
      try {
        const res = await api.get(
          `/crypto/candles/${market}`,
          { params: { range } }
        );

        return Array.isArray(res.data)
          ? res.data.map((c) => ({
              time: new Date(c.candle_date_time_kst).getTime(),
              price: c.trade_price
            }))
          : [];
      } catch (err) {
        console.error("chart fetch error", err);
        return [];
      }
    },
    [market]
  );

  /* ===============================
     관심종목 추가
  =============================== */
  const addToWatchlist = useCallback(async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("로그인이 필요합니다.");
        return;
      }

      if (!detail) {
        setError("코인 정보가 없습니다.");
        return;
      }

      await api.post(
        "/watchlist",
        {
          symbol: detail.symbol || market,
          name:
            detail.nameKr
              ? `${detail.nameKr} (${detail.code || market.replace("KRW-", "")})`
              : detail.name || market.replace("KRW-", ""),
          market: "CRYPTO"
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      setAdded(true);
      setError("");
    } catch (err) {
      console.error("add watchlist failed", err);
      setError("이미 관심종목이거나 오류가 발생했습니다.");
    }
  }, [detail, market]);

  /* ===============================
     포트폴리오 추가
  =============================== */
  const addToPortfolio = async (qty, buy) => {
    const token = localStorage.getItem("token");
    if (!token) return "로그인이 필요합니다.";
    if (!detail) return "코인 정보가 없습니다.";

    if (!qty || !buy || Number(qty) <= 0 || Number(buy) <= 0) {
      return "보유 수량과 매수가를 올바르게 입력하세요.";
    }

    try {
      await api.post(
        "/portfolio",
        {
          symbol: detail.symbol || market,
          name:
            detail.nameKr
              ? detail.nameKr
              : detail.name || market.replace("KRW-", ""),
          market: "CRYPTO",
          quantity: Number(qty),
          buyPrice: Number(buy)
        },
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );

      return true;
    } catch (err) {
      console.error("portfolio add error", err);
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

  const title =
    detail.nameKrFull ||
    detail.nameKr ||
    market.replace("KRW-", "");
  return (
    <div className="stock-container">
      <AssetActions
        name={title}
        symbol={market.replace("KRW-", "")}
        marketLabel="가상자산"

        price={detail.price}
        change={detail.change}
        rate={detail.rate}
        prevPrice={prevPrice}

        fetchChart={fetchChartByRange}
        chartColor="#ff8a00"
        market="CRYPTO"
        defaultRange="1d"

        open={detail.open}
        high={detail.high}
        low={detail.low}
        volume={detail.volume}
        high52={detail.high52}
        low52={detail.low52}

        added={added}
        disabled={false}
        onAddWatch={addToWatchlist}
        onAddPortfolio={addToPortfolio}
      />

      {error && <p className="stock-error">{error}</p>}
    </div>
  );

}
