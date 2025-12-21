import { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";

export default function Register({ setIsAuth }) {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [day, setDay] = useState("");

  const [msg, setMsg] = useState("");
  const [usernameMsg, setUsernameMsg] = useState("");
  const [usernameAvailable, setUsernameAvailable] = useState(null);

  const [loading, setLoading] = useState(false);

  const navigate = useNavigate();

  /* ===============================
     🔥 회원가입 페이지에서만 footer 숨김
  =============================== */
  useEffect(() => {
    document.body.classList.add("hide-footer");
    return () => {
      document.body.classList.remove("hide-footer");
    };
  }, []);

  /* ===============================
     이메일 형식 체크
  =============================== */
  const isValidEmail = (value) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);

  /* ===============================
     🔍 아이디 입력 시 실시간 중복 체크
  =============================== */
  const handleUsernameChange = async (e) => {
    const value = e.target.value;
    setUsername(value);
    setUsernameAvailable(null);
    setUsernameMsg("");

    if (value.length < 3) {
      setUsernameMsg("아이디는 3자 이상 입력해주세요");
      return;
    }

    try {
      const res = await axios.get(
        `/api/auth/check-username?username=${value}`
      );

      if (res.data.available) {
        setUsernameAvailable(true);
        setUsernameMsg("사용 가능한 아이디입니다");
      } else {
        setUsernameAvailable(false);
        setUsernameMsg("이미 사용 중인 아이디입니다");
      }
    } catch {
      setUsernameMsg("아이디 확인 중 오류 발생");
    }
  };

  /* ===============================
     회원가입 처리
  =============================== */
  const handleRegister = async () => {
    if (!username || usernameAvailable === false) {
      setMsg("아이디를 다시 확인해주세요");
      return;
    }

    if (!email || !isValidEmail(email)) {
      setMsg("이메일 형식이 올바르지 않습니다");
      return;
    }

    if (!password) {
      setMsg("비밀번호를 입력해주세요");
      return;
    }

    if (!year || !month || !day) {
      setMsg("생년월일을 선택해주세요");
      return;
    }

    setLoading(true);
    setMsg("");

    try {
      await axios.post("/api/auth/register", {
        username,
        email,
        password,
        birthDate: `${year}-${month}-${day}`,
      });

      const res = await axios.post("/api/auth/login", {
        email,
        password,
      });

      localStorage.setItem("token", res.data.token);
      localStorage.setItem("user", JSON.stringify(res.data.user));

      setIsAuth(true);
      navigate("/dashboard");
    } catch (err) {
      setMsg(err.response?.data?.message || "회원가입 실패");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-page">
      <button className="register-close" onClick={() => navigate(-1)}>
        ✕
      </button>

      <div className="register-logo" onClick={() => navigate("/")}>
        <img src="/logo22.png" alt="Stock Events Logo" />
      </div>

      <div className="register-card">
        <h1 className="register-title">가입하기</h1>

        <label>사용자 이름</label>
        <input
          value={username}
          onChange={handleUsernameChange}
          placeholder="닉네임"
        />
        {usernameMsg && (
          <p className={usernameAvailable ? "msg-success" : "msg-error"}>
            {usernameMsg}
          </p>
        )}

        <label>메일</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label>비밀번호</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <label>생년월일</label>
        <div className="birth-select">
          <select value={year} onChange={(e) => setYear(e.target.value)}>
            <option value="">년</option>
            {Array.from({ length: 100 }, (_, i) => {
              const y = new Date().getFullYear() - i;
              return (
                <option key={y} value={y}>
                  {y}
                </option>
              );
            })}
          </select>

          <select value={month} onChange={(e) => setMonth(e.target.value)}>
            <option value="">월</option>
            {Array.from({ length: 12 }, (_, i) => (
              <option
                key={i + 1}
                value={String(i + 1).padStart(2, "0")}
              >
                {i + 1}
              </option>
            ))}
          </select>

          <select value={day} onChange={(e) => setDay(e.target.value)}>
            <option value="">일</option>
            {Array.from({ length: 31 }, (_, i) => (
              <option
                key={i + 1}
                value={String(i + 1).padStart(2, "0")}
              >
                {i + 1}
              </option>
            ))}
          </select>
        </div>

        <button
          className="register-btn"
          onClick={handleRegister}
          disabled={loading}
        >
          {loading ? "처리 중..." : "계정 만들기"}
        </button>

        {msg && <p className="register-msg">{msg}</p>}

        <p className="register-footer">
          이미 계정이 있나요? <Link to="/login">로그인</Link>
        </p>
      </div>
    </div>
  );
}
