import { Logo } from "./Bits";
import { Link } from "react-router-dom";
import { APP_STORE_URL, BUSINESS } from "../site";

export function Footer() {
  return (
    <footer className="footer">
      <div className="container footer-inner">
        <div className="footer-top">
          <Link to="/" className="brand">
            <Logo size={24} />
            <span>데일리오픽</span>
          </Link>
          <nav className="footer-links" aria-label="정책">
            <Link to="/privacy">
              <strong>개인정보처리방침</strong>
            </Link>
            <Link to="/refund">환불 규정</Link>
            <Link to="/help">고객센터</Link>
            <a href={APP_STORE_URL} target="_blank" rel="noreferrer">
              App Store
            </a>
          </nav>
        </div>
        <dl className="business">
          <div><dt>상호</dt><dd>{BUSINESS.name}</dd></div>
          <div><dt>대표자</dt><dd>{BUSINESS.owner}</dd></div>
          <div><dt>사업자등록번호</dt><dd>{BUSINESS.registration}</dd></div>
          <div><dt>사업장 주소</dt><dd>{BUSINESS.address}</dd></div>
          {BUSINESS.phone && <div><dt>대표전화</dt><dd><a href={`tel:${BUSINESS.phone}`}>{BUSINESS.phone}</a></dd></div>}
          <div><dt>이메일</dt><dd><a href={`mailto:${BUSINESS.email}`}>{BUSINESS.email}</a></dd></div>
        </dl>
        <p className="copyright">© {new Date().getFullYear()} DailyOPIc. All rights reserved.</p>
      </div>
    </footer>
  );
}
