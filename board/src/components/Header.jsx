import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "./Header.css";

export default function Header({ setIsAuth, isAuth }) {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem("user"));

  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [searchItems, setSearchItems] = useState([]);
  const [prices, setPrices] = useState({}); // { symbol: { price, changeRate } }

  /* ===============================
     🔍 통합 검색 (서버에서 검색)
  =============================== */
  useEffect(() => {
    if (!searchOpen || query.trim() === "") {
      setSearchItems([]);
      return;
    }

    const fetchSearchItems = async () => {
      try {
        const res = await axios.get("/api/search", {
          params: { query }
        });
        setSearchItems(res.data);
      } catch (err) {
        console.error("검색 실패", err);
      }
    };

    const timer = setTimeout(fetchSearchItems, 300); // debounce
    return () => clearTimeout(timer);
  }, [query, searchOpen]);

  /* ===============================
     💰 검색 결과 현재가 로드 (상위 5개)
  =============================== */
  useEffect(() => {
    if (!searchOpen || searchItems.length === 0) return;

    searchItems.slice(0, 5).forEach(async (item) => {
      if (prices[item.symbol]) return;

      try {
        const res = await axios.get("/api/search/price", {
          params: {
            type: item.type,
            symbol: item.symbol,
          },
        });

        setPrices((prev) => ({
          ...prev,
          [item.symbol]: res.data,
        }));
      } catch (err) {
        console.error("가격 로드 실패", item.symbol);
      }
    });
  }, [searchItems, searchOpen]);

  const handleSelectItem = (item) => {
    setSearchOpen(false);
    setQuery("");
    setSearchItems([]);
    setPrices({});

    if (item.type === "CRYPTO") {
      navigate(`/crypto/${item.symbol}`);
    } else if (item.type === "KR") {
      navigate(`/stock/korea/${item.symbol}`);
    } else if (item.type === "US") {
      navigate(`/stock/us/${item.symbol}`);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setIsAuth(false);
    navigate("/login");
  };

  return (
    <>
      <header className="header">
        {/* Logo */}
        <div className="header-left">
          <img
            src="/logo.png"
            alt="Logo"
            className="logo"
            onClick={() => navigate("/dashboard")}
          />
        </div>

        {/* Menu */}
        <nav className="header-menu">
          <span onClick={() => navigate("/dashboard")}>대시보드</span>
          <span onClick={() => navigate("/watchlist")}>관심종목</span>
          <span onClick={() => navigate("/portfolio")}>포트폴리오</span>
          <span>블로그</span>
          <span>도움말</span>
        </nav>

        {/* Right */}
        <div className="header-right">
          <button
            className="icon-btn"
            aria-label="Search"
            onClick={() => {
              setSearchOpen(true);
              setQuery("");
              setSearchItems([]);
              setPrices({});
            }}
          >
            🔍
          </button>

          {!isAuth ? (
            <>
              <button className="login-btn" onClick={() => navigate("/login")}>
                로그인
              </button>
              <button
                className="signup-btn"
                onClick={() => navigate("/register")}
              >
                가입하기
              </button>
            </>
          ) : (
            <>
              <button onClick={() => navigate("/profile")}>
                {user?.username || "User"}
              </button>
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>
            </>
          )}
        </div>
      </header>

      {/* 🔥 검색 오버레이 */}
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
                placeholder="주식 · 가상화폐 검색 (예: 삼성전자, 005930, BTC)"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            <div className="search-panel">
              {query === "" && (
                <div className="result-item">검색어를 입력하세요</div>
              )}

              {query !== "" && searchItems.length === 0 && (
                <div className="result-item">검색 결과가 없습니다</div>
              )}

              {searchItems.map((item) => {
                const priceInfo = prices[item.symbol];

                return (
                  <div
                    key={`${item.type}-${item.symbol}`}
                    className="result-item"
                    onClick={() => handleSelectItem(item)}
                  >
                    <div>
                      <strong>
                        {item.name} ({item.symbol})
                      </strong>
                      <div className="asset-type">
                        {item.type === "CRYPTO"
                          ? "가상화폐"
                          : item.type === "KR"
                          ? "국내주식"
                          : "해외주식"}
                      </div>
                    </div>

                    {priceInfo && (
                      <div
                        className={
                          priceInfo.changeRate >= 0
                            ? "price-up"
                            : "price-down"
                        }
                      >
                        {priceInfo.price.toLocaleString()}
                        {item.type === "CRYPTO" ? "원" : ""}
                        <br />
                        {priceInfo.changeRate >= 0 ? "+" : ""}
                        {priceInfo.changeRate.toFixed(2)}%
                      </div>
                    )}
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
