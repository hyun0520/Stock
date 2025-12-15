import { useNavigate } from "react-router-dom";

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="page">
      <h1 className="title">📈 My Portfolio</h1>
      <p className="subtitle">
        국내주식 · 해외주식 · 가상화폐를 한눈에 관리하세요
      </p>

      <div className="card" style={{ marginTop: 30 }}>
        <p>✔ 실시간 자산 요약</p>
        <p>✔ 포트폴리오 분석</p>
        <p>✔ 수익률 트래킹</p>

        <button
          className="primary"
          style={{ marginTop: 20 }}
          onClick={() => navigate("/login")}
        >
          로그인하고 시작하기
        </button>
      </div>
    </div>
  );
}
