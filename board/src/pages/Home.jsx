import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "../styles/Home.css";

export default function Home() {
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      navigate("/dashboard", { replace: true });
    }
  }, [navigate]);

  return (
    <div className="home-wrapper">
      {/* ===== Hero ===== */}
      <section className="home-hero">
        <h1 className="home-title">
          CHECK MY ASSETS, <br />
          <span>한 곳에서 관리하세요</span>
        </h1>

        <p className="home-subtitle">
          국내주식 · 해외주식 · 가상화폐까지 <br />
          실시간 자산 흐름을 한눈에
        </p>

        <button
          className="home-cta"
          onClick={() => navigate("/login")}
        >
          로그인하고 시작하기 →
        </button>
      </section>

      {/* ===== Features ===== */}
      <section className="home-features">
        <div className="feature-card">
          <div className="icon">⚡</div>
          <h3>실시간 자산 요약</h3>
          <p>현재가 · 수익률 · 평가금액을 즉시 확인</p>
        </div>

        <div className="feature-card">
          <div className="icon">📈</div>
          <h3>포트폴리오 분석</h3>
          <p>보유 자산을 한눈에 분석하고 비교</p>
        </div>

        <div className="feature-card">
          <div className="icon">💰</div>
          <h3>수익률 트래킹</h3>
          <p>매수가 대비 손익을 실시간 추적</p>
        </div>
      </section>
    </div>
  );
}
