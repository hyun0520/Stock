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

  // 최근검색에서 삭제
  const removeRecentItem = (item) => {
  const prev = JSON.parse(localStorage.getItem("recentSearches")) || [];

    const updated = prev.filter(
      (i) => !(i.symbol === item.symbol && i.type === item.type)
    );

    localStorage.setItem("recentSearches", JSON.stringify(updated));
    setRecentItems(updated);

    
    setActiveIndex((idx) => Math.min(idx, updated.length - 1));
  };

  /* ===============================
     최근 검색 로드
  =============================== */
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("recentSearches")) || [];
    setRecentItems(saved);
  }, []);

  /* ===============================
     검색
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
          params: { query },
        });
        setSearchItems(res.data);
        setActiveIndex(-1);
      } catch (err) {
        console.error("검색 실패", err);
      }
    };

    const timer = setTimeout(fetchSearch, 300);
    return () => clearTimeout(timer);
  }, [query, searchOpen]);

  /* ===============================
     💰 가격 로드 (상위 5개만)
  =============================== */
  useEffect(() => {
    searchItems.slice(0, 5).forEach(async (item) => {
      if (prices[item.symbol]) return;

      try {
        const res = await axios.get("/api/search/price", {
          params: { type: item.type, symbol: item.symbol },
        });

        setPrices((prev) => ({
          ...prev,
          [item.symbol]: res.data,
        }));
      } catch {}
    });
  }, [searchItems]);

  /* ===============================
     키보드 이동 + 스크롤
  =============================== */
  useEffect(() => {
    if (!searchOpen) return;

    const handleKey = (e) => {
      const list =
        query === "" ? recentItems : searchItems;

      if (list.length === 0) return;

      if (e.key === "ArrowDown") {
        e.preventDefault();
        setActiveIndex((prev) =>
          Math.min(prev + 1, list.length - 1)
        );
      }

      if (e.key === "ArrowUp") {
        e.preventDefault();
        setActiveIndex((prev) => Math.max(prev - 1, 0));
      }

      if (e.key === "Enter" && activeIndex >= 0) {
        handleSelectItem(list[activeIndex]);
      }

      if (e.key === "Escape") {
        setSearchOpen(false);
      }
    };

    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [searchOpen, activeIndex, searchItems, recentItems, query]);

  /* ===============================
     스크롤 따라가기
  =============================== */
  useEffect(() => {
    if (!listRef.current || activeIndex < 0) return;

    const el = listRef.current.children[activeIndex];
    el?.scrollIntoView({ block: "nearest" });
  }, [activeIndex]);

  /* ===============================
     최근 검색 저장
  =============================== */
  const saveRecent = (item) => {
    const prev = JSON.parse(localStorage.getItem("recentSearches")) || [];

    const updated = [
      item,
      ...prev.filter(
        (i) => i.symbol !== item.symbol || i.type !== item.type
      ),
    ].slice(0, 5);

    localStorage.setItem("recentSearches", JSON.stringify(updated));
    setRecentItems(updated);
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
    } else {
      navigate(`/stock/us/${item.symbol}`);
    }
  };

  const handleLogout = () => {
    localStorage.clear();
    setIsAuth(false);
    navigate("/login");
  };

  const renderList = query === "" ? recentItems : searchItems;

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
          <span onClick={() => navigate("/dashboard")}>대시보드</span>
          <span onClick={() => navigate("/watchlist")}>관심종목</span>
          <span onClick={() => navigate("/portfolio")}>포트폴리오</span>
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
              <button onClick={() => navigate("/profile")}>
                {user?.username}
              </button>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          ) : (
            <>
              <button className="login-btn" onClick={() => navigate("/login")}>
                로그인
              </button>
              <button className="signup-btn" onClick={() => navigate("/register")}>
                가입하기
              </button>
            </>
          )}
        </div>
      </header>

      {searchOpen && (
        <>
          <div className="search-overlay" onClick={() => setSearchOpen(false)} />

          <div className="search-modal">
            <div className="search-modal-input">
              <input
                autoFocus
                className="search-modal-field"
                placeholder="주식 · 가상화폐 검색"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="search-panel" ref={listRef}>
              {renderList.length === 0 && (
                <div className="result-item">
                  {query === "" ? "최근 검색이 없습니다" : "검색 결과가 없습니다"}
                </div>
              )}

              {renderList.map((item, idx) => {
                const price = prices[item.symbol];
                const isRecent = query === "";

                  return (
                    <div
                      key={`${item.type}-${item.symbol}`}
                      className={`result-item ${
                        idx === activeIndex ? "active" : ""
                      }`}
                      onClick={() => handleSelectItem(item)}
                    >
                      <div>
                        <strong>
                          {item.name} ({item.symbol})
                        </strong>
                        <div className="asset-type">
                          {item.type === "CRYPTO" ? "가상화폐" : "국내주식"}
                        </div>
                      </div>

                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {/* 💰 가격 */}
                        {price && (
                          <div
                            style={{
                              color:
                                price.changeRate >= 0 ? "#ef4444" : "#3b82f6",
                              textAlign: "right",
                            }}
                          >
                            {price.price.toLocaleString()}
                            <br />
                            {price.changeRate >= 0 ? "+" : ""}
                            {price.changeRate.toFixed(2)}%
                          </div>
                        )}

                        {/* ❌ 최근 검색 삭제 버튼 */}
                        {isRecent && (
                          <button
                            className="recent-remove-btn"
                            onClick={(e) => {
                              e.stopPropagation(); // 🔥 클릭 이동 방지
                              removeRecentItem(item);
                            }}
                          >
                            ✕
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </>
      )}
    </>
  );
}
