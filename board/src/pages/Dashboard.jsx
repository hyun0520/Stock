import { useNavigate } from "react-router-dom";

export default function Dashboard({ setIsAuth }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    // 인증 상태 false
    setIsAuth(false);

    navigate("/login");
  };

  return (
    <div className="page">
      <h2 className="title">📊 Portfolio Dashboard</h2>

      <div className="card">
        <p className="subtitle">총 자산</p>
        <h1>₩18,452,300</h1>

        <p>📈 오늘 수익: +₩352,000 ( +1.82% )</p>
      </div>
    </div>
  );
}