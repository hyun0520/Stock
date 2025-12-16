import "./Footer.css";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        {/* 왼쪽 텍스트 영역 */}
        <div>
          <div className="footer-links">
            <span>국내 1위 IT 아웃소싱 플랫폼, Check My Assets</span>
            <span className="dot">·</span>
            <a href="#">이용약관</a>
            <span className="dot">·</span>
            <a href="#">개인정보 처리방침</a>
          </div>

          {/* 🔽 여기서부터 자동으로 밑으로 내려감 */}
          <div className="footer-info">
            <p>
              (주)체크마이에셋 | 서울특별시 강남구 테헤란로 211 | 고객센터
              02-0000-0000
            </p>
            <p>© 2025 Check My Assets Corp.</p>
          </div>
        </div>

        {/* 오른쪽 버튼 */}
        <div className="footer-right">
          <button className="related-btn">
            관련사이트 <span>＋</span>
          </button>
        </div>
      </div>
    </footer>
  );
}
