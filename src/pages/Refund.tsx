import { Link } from "react-router-dom";
import { CONTACT_EMAIL } from "../site";

// 결제대행사(토스페이먼츠) 심사와 이용자 안내용 환불 규정. 문구를 바꾸면 시행일도 함께 바꾼다.
export function Refund() {
  return (
    <article className="page container prose legal">
      <p className="eyebrow">정책</p>
      <h1>환불 규정</h1>
      <p>
        <strong>DailyOPIc(데일리오픽)</strong>(이하 “서비스”)에서 결제한 유료 상품의 청약철회와 환불 기준을
        안내합니다.
      </p>
      <p className="effective">시행일: 2026년 11월 21일</p>

      <h2>1. 적용 대상</h2>
      <ul>
        <li>웹사이트(www.dailyopic.link)에서 결제한 이용권(예: 베이직 · 플러스 · 프로 30일 이용권)</li>
        <li>iPhone 앱에서 App Store로 결제한 구독은 아래 4항을 따릅니다.</li>
      </ul>

      <h2>2. 웹 이용권 환불 기준</h2>
      <ol>
        <li>결제일로부터 7일 이내이고 이용권을 사용하지 않은 경우 전액 환불합니다.</li>
        <li>
          이용을 시작한 30일 이용권은 남은 이용 일수만큼 일할 계산하여 환불합니다.
          <br />
          환불 금액 = 결제 금액 × 남은 일수 ÷ 30 (원 단위 미만 버림)
        </li>
        <li>이용권은 자동으로 다시 결제되지 않습니다. 기간이 끝나면 무료 플랜으로 돌아갑니다.</li>
        <li>서비스 장애 등 서비스의 책임으로 이용하지 못한 기간은 이용 일수에서 빼고 계산합니다.</li>
      </ol>

      <h2>3. 환불 신청과 처리</h2>
      <ul>
        <li>
          고객센터 이메일 <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>로 로그인한 계정의 이메일, 결제일,
          결제 상품을 적어 보내 주세요.
        </li>
        <li>확인 후 결제한 수단으로 영업일 기준 3~7일 이내에 환불합니다. 카드사 사정에 따라 환불 반영이 늦어질 수 있습니다.</li>
        <li>환불이 완료되면 해당 이용권은 즉시 사용할 수 없게 됩니다.</li>
      </ul>

      <h2>4. App Store 구독</h2>
      <ul>
        <li>
          iPhone 앱에서 결제한 구독의 해지와 환불은 Apple 정책을 따릅니다. iPhone의 설정 → Apple 계정 → 구독에서
          해지하고, 환불은 Apple(reportaproblem.apple.com)에 요청해 주세요.
        </li>
        <li>구독은 다음 결제일 24시간 전까지 해지하지 않으면 자동으로 갱신됩니다.</li>
      </ul>

      <h2>5. 문의</h2>
      <p>
        환불과 결제 관련 문의는 <a href={`mailto:${CONTACT_EMAIL}`}>{CONTACT_EMAIL}</a>로 보내 주세요. 자주 묻는 질문은{" "}
        <Link to="/help">고객센터</Link>에서 확인할 수 있어요.
      </p>
    </article>
  );
}
