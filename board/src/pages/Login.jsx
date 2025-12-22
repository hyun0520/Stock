import { useState } from "react";
import { api } from "../services/api";
import { useNavigate, Link } from "react-router-dom";

export default function Login({ setIsAuth }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  const handleLogin = async () => {
    if (!email || !password) {
      setMsg("이메일과 비밀번호를 입력해주세요");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      const res = await api.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setIsAuth(true);
      navigate("/dashboard");
    } catch (err) {
      setMsg(err.response?.data?.message || "로그인 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">로그인</h1>

        <label>사용자명 또는 이메일</label>
        <input
          type="email"
          placeholder="example@email.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <div className="password-row">
          <label>비밀번호</label>
          <span className="forgot" onClick={() => alert("추후 구현 예정")}>
            비밀번호를 잊으셨나요?
          </span>
        </div>

        <input
          type="password"
          placeholder="비밀번호 입력"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <button
          className="login-btn"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "로그인 중..." : "로그인"}
        </button>

        {msg && <p className="login-msg">{msg}</p>}

        <p className="login-footer">
          아직 계정이 없나요? <Link to="/register">가입하기</Link>
        </p>
      </div>
    </div>
  );
}
