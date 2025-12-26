import "../styles/Footer.css";
export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div>
          <div className="footer-links">
            <span>체크마이에셋, Check My Assets</span>
            <span className="dot">·</span>
            <a href="#">이용약관</a>
            <span className="dot">·</span>
            <a href="#">개인정보 처리방침</a>
          </div>
          <div className="footer-info">
            <p>
              체크마이에셋 | 경기도 고양시 일산동구 노루목로 79
              02-3456-7891
            </p>
            <p>© 2025 Check My Assets Corp.</p>
          </div>
        </div>
        <div className="footer-right">
        <button
            className="related-btn"
            onClick={() =>
              window.open("https://chunghyunleeportfolio.netlify.app/", "_blank")
            }
          >
            관련사이트 <span>＋</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
