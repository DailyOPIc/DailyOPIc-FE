import { Link } from "react-router-dom";

export function NotFound() {
  return (
    <div className="page container page-head">
      <p className="eyebrow">404</p>
      <h1>페이지를 찾을 수 없어요</h1>
      <p className="lead">주소가 바뀌었거나 없는 페이지예요.</p>
      <Link to="/" className="button button-primary">
        홈으로
      </Link>
    </div>
  );
}
