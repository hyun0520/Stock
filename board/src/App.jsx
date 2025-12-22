import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";

import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Profile from "./pages/Profile";
import Register from "./pages/Register";
import StockDetail from "./pages/StockDetail";
import Watchlist from "./pages/Watchlist";
import Portfolio from "./pages/Portfolio";
import CryptoDetail from "./pages/CryptoDetail";
import StockDetailUS from "./pages/usStockDetail";

function App() {
  const [isAuth, setIsAuth] = useState(
    !!localStorage.getItem("token")
  );

  const location = useLocation();

  // 회원가입 페이지만 Header 숨김
  const hideHeader = location.pathname === "/register";

  return (
    <div className="app-shell">
      {!hideHeader && (
        <Header setIsAuth={setIsAuth} isAuth={isAuth} />
      )}

      
      <main className="app-main">
        <Routes>
          {/* 공개 페이지 */}
          <Route path="/" element={<Home />} />

          <Route
            path="/login"
            element={
              isAuth ? (
                <Navigate to="/dashboard" />
              ) : (
                <Login setIsAuth={setIsAuth} />
              )
            }
          />

          <Route
            path="/register"
            element={
              isAuth ? (
                <Navigate to="/dashboard" />
              ) : (
                <Register setIsAuth={setIsAuth} />
              )
            }
          />

          {/* 보호 페이지 */}
          <Route
            path="/dashboard"
            element={
              isAuth ? (
                <Dashboard setIsAuth={setIsAuth} />
              ) : (
                <Navigate to="/login" />
              )
            }
          />

          <Route
            path="/profile"
            element={
              isAuth ? <Profile /> : <Navigate to="/login" />
            }
          />

          {/* 관심종목 */}
          <Route path="/watchlist" element={<Watchlist />} />

          {/* 포트폴리오 */}
          <Route path="/portfolio" element={<Portfolio />} />

          {/* 가상화폐 */}
          <Route path="/crypto/:market" element={<CryptoDetail />} />

          {/* 국내주식 */}
          <Route path="/stock/korea/:symbol" element={<StockDetail />} />

          {/* 미국주식 */}
          <Route path="/stock/us/:symbol" element={<StockDetailUS />} />

          {/* fallback */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;
