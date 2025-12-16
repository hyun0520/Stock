import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Header.css";

export default function Header({ setIsAuth, isAuth }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchItems, setSearchItems] = useState([]);
  const [recentItems, setRecentItems] = useState([]);
  const [prices, setPrices] = useState({});
  const [activeIndex, setActiveIndex] = useState(-1);

  const listRef = useRef(null);

  /* ===============================
     최근 검색 로드
  =============================== */
  useEffect(() => {
    const saved =
      JSON.parse(localStorage.getItem("recentSearches")) || [];
    setRecentItems(saved);
  }, []);

  /* ===============================
     🔍 검색
  =============================== */
  useEffect(() => {
    if (!searchOpen) return;

    if (query.trim() === "") {
      setSearchItems([]);
      setActiveIndex(-1);
      return;
    }

    const fetchSearch = async () => {
      try {
        const res = await axios.get("/api/search", {
          params: { query }
        });
        setSearchItems(res.data || []);
        setActiveIndex(-1);
      } catch (err) {
        console.error("검색 실패", err);
      }
    };

    const timer = setTimeout(fetchSearch, 300);
    return () => clearTimeout(timer);
  }, [query, searchOpen]);

  /* ===============================
     💰 가격 로드
  =============================== */
  useEffect(() => {
    searchItems.slice(0, 10).forEach(async (item) => {
      if (prices[item.symbol]) return;
      try {
        const res = await axios.get("/api/search/price", {
          params: { type: item.type, symbol: item.symbol }
        });
        setPrices((prev) => ({
          ...prev,
          [item.symbol]: res.data
        }));
      } catch {}
    });
  }, [searchItems]);

  /* ===============================
     최근 검색 저장
  =============================== */
  const saveRecent = (item) => {
    const prev =
      JSON.parse(localStorage.getItem("recentSearches")) || [];

    const updated = [
      item,
      ...prev.filter(
        (i) => i.symbol !== item.symbol || i.type !== item.type
      )
    ].slice(0, 8);

    localStorage.setItem(
      "recentSearches",
      JSON.stringify(updated)
    );
    setRecentItems(updated);
  };

  /* ===============================
     🗑️ 최근 검색 개별 삭제
  =============================== */
  const removeRecentItem = (symbol, type) => {
    const updated = recentItems.filter(
      (i) => !(i.symbol === symbol && i.type === type)
    );

    localStorage.setItem(
      "recentSearches",
      JSON.stringify(updated)
    );
    setRecentItems(updated);
  };

  /* ===============================
     🧹 최근 검색 전체 삭제
  =============================== */
  const clearRecentItems = () => {
    if (!window.confirm("최근 검색을 모두 삭제할까요?")) return;
    localStorage.removeItem("recentSearches");
    setRecentItems([]);
  };

  /* ===============================
     선택 처리
  =============================== */
  const handleSelectItem = (item) => {
    saveRecent(item);

    setSearchOpen(false);
    setQuery("");
    setSearchItems([]);
    setPrices({});
    setActiveIndex(-1);

    if (item.type === "CRYPTO") {
      navigate(`/crypto/${item.symbol}`);
    } else if (item.type === "KR") {
      navigate(`/stock/korea/${item.symbol}`);
    } else if (item.type === "US") {
      const ticker =
        item.ticker || item.displaySymbol || item.symbol;
      navigate(`/stock/us/${ticker}`);
    }
  };

  /* ===============================
     🔹 렌더 리스트
  =============================== */
  const renderList = query === "" ? recentItems : searchItems;

  const grouped = {
    KR: renderList.filter((i) => i.type === "KR"),
    US: renderList.filter((i) => i.type === "US"),
    CRYPTO: renderList.filter((i) => i.type === "CRYPTO")
  };

  const flatList = [
    ...grouped.KR,
    ...grouped.US,
    ...grouped.CRYPTO
  ];

  /* ===============================
     ⌨️ 키보드 이동
  =============================== */
  useEffect(() => {
    if (!searchOpen) return;

    const handleKey = (e) => {
      if (!flatList.length) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((p) =>
          Math.min(p + 1, flatList.length - 1)
        );
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((p) => Math.max(p - 1, 0));
      }

      if (e.key === "Enter" && activeIndex >= 0) {
        handleSelectItem(flatList[activeIndex]);
      }

      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [searchOpen, activeIndex, flatList]);

  useEffect(() => {
    if (!listRef.current || activeIndex < 0) return;
    listRef.current.children[
      activeIndex + 1
    ]?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  const SectionTitle = ({ label }) => (
    <div
      style={{
        padding: "8px 12px",
        fontSize: 12,
        fontWeight: 600,
        color: "#9aa4b2",
        borderBottom:
          "1px solid rgba(255,255,255,0.08)"
      }}
    >
      {label}
    </div>
  );

  const SearchItem = ({ item }) => {
    const price = prices[item.symbol];
    const isRecent = query === "";

    return (
      <div
        className={`result-item ${
          flatList[activeIndex]?.symbol === item.symbol
            ? "active"
            : ""
        }`}
        style={{
          display: "flex",
          justifyContent: "space-between"
        }}
      >
        <div
          onClick={() => handleSelectItem(item)}
          style={{ cursor: "pointer" }}
        >
          <strong>
            {item.name} ({item.symbol})
          </strong>
          <div className="asset-type">
            {item.type === "CRYPTO"
              ? "가상화폐"
              : item.type === "US"
              ? "미국주식"
              : "국내주식"}
          </div>
        </div>

        <div style={{ textAlign: "right" }}>
          {price && (
            <>
              <div
                style={{
                  color:
                    price.changeRate >= 0
                      ? "#ef4444"
                      : "#3b82f6"
                }}
              >
                {price.price.toLocaleString()}
              </div>
              <div style={{ fontSize: 12 }}>
                {price.changeRate >= 0 ? "+" : ""}
                {price.changeRate.toFixed(2)}%
              </div>
            </>
          )}

          {isRecent && (
            <button
              className="recent-remove-btn"
              onClick={(e) => {
                e.stopPropagation();
                removeRecentItem(item.symbol, item.type);
              }}
            >
              X
            </button>
          )}
        </div>
      </div>
    );
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsAuth(false);
    navigate("/login");
  };

  return (
    <>
      <header className="header">
        <div className="header-left">
          <img
            src="/logo.png"
            className="logo"
            alt="logo"
            onClick={() => navigate("/dashboard")}
          />
        </div>

        <nav className="header-menu">
          <span onClick={() => navigate("/dashboard")}>
            대시보드
          </span>
          <span onClick={() => navigate("/watchlist")}>
            관심종목
          </span>
          <span onClick={() => navigate("/portfolio")}>
            포트폴리오
          </span>
          <span>도움말</span>
        </nav>

        <div className="header-right">
          <button
            className="icon-btn"
            onClick={() => {
              setSearchOpen(true);
              setQuery("");
            }}
          >
            🔍
          </button>

          {isAuth ? (
            <>
              <button
                onClick={() => navigate("/profile")}
              >
                {user?.username}
              </button>
              <button
                className="logout-btn"
                onClick={handleLogout}
              >
                Logout
              </button>
            </>
          ) : (
            <>
              <button
                className="login-btn"
                onClick={() => navigate("/login")}
              >
                로그인
              </button>
              <button
                className="signup-btn"
                onClick={() => navigate("/register")}
              >
                가입하기
              </button>
            </>
          )}
        </div>
      </header>

      {searchOpen && (
        <>
          <div
            className="search-overlay"
            onClick={() => setSearchOpen(false)}
          />

          <div className="search-modal">
            <div className="search-modal-input">
              <input
                autoFocus
                className="search-modal-field"
                placeholder="국내주식 · 미국주식 · 가상화폐 검색"
                value={query}
                onChange={(e) =>
                  setQuery(e.target.value)
                }
              />
            </div>

            <div className="search-panel" ref={listRef}>
              {/* 최근검색 */}
              {query === "" && recentItems.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    padding: "8px 12px",
                    fontSize: 12,
                    color: "#9aa4b2",
                    borderBottom: "1px solid rgba(255,255,255,0.08)"
                  }}
                >
                  <span>🕘 최근 검색</span>
                  <button
                    onClick={clearRecentItems}
                    style={{
                      background: "none",
                      border: "none",
                      color: "#ef4444",
                      cursor: "pointer",
                      fontSize: 12
                    }}
                  >
                    전체 삭제
                  </button>
                </div>
              )}

              {/* 🇰🇷 국내주식 */}
              {grouped.KR.length > 0 && (
                <>
                  <SectionTitle label="🇰🇷 국내주식" />
                  {grouped.KR.map((item) => (
                    <SearchItem
                      key={`KR-${item.symbol}`}
                      item={item}
                    />
                  ))}
                </>
              )}

              {/* 🇺🇸 미국주식 */}
              {grouped.US.length > 0 && (
                <>
                  <SectionTitle label="🇺🇸 미국주식" />
                  {grouped.US.map((item) => (
                    <SearchItem
                      key={`US-${item.symbol}`}
                      item={item}
                    />
                  ))}
                </>
              )}

              {/* 🪙 가상화폐 */}
              {grouped.CRYPTO.length > 0 && (
                <>
                  <SectionTitle label="🪙 가상화폐" />
                  {grouped.CRYPTO.map((item) => (
                    <SearchItem
                      key={`CRYPTO-${item.symbol}`}
                      item={item}
                    />
                  ))}
                </>
              )}
            </div>
          </div>
        </>
      )}
    </>
  );
}
