import { CONTACT_EMAIL } from "../site";

const FAQ = [
  {
    q: "데일리 토큰은 언제 다시 채워지나요?",
    a: "매일 자정(한국 시간)에 플랜별 개수만큼 다시 채워져요. 남은 토큰은 다음 날로 이월되지 않아요.",
  },
  {
    q: "앱을 열기만 해도 토큰이 줄어드나요?",
    a: "아니요. 오늘의 문제 세트는 무료예요. 토큰은 AI 분석을 받거나 새 문제 세트로 바꿀 때만 써요.",
  },
  {
    q: "학습 단계와 오픽게임은 하루에 얼마나 할 수 있나요?",
    a: "학습 단계는 무료 하루 10단계, 베이직부터는 제한 없이 이어서 할 수 있어요. 단계마다 AI 분석에 토큰 1개를 써요. 오픽게임은 모든 플랜에서 게임마다 하루 5판이고, 판마다 다른 문제가 나와요. 매일 자정(한국 시간)에 다시 채워져요.",
  },
  {
    q: "친구와 기록 대결은 어떻게 하나요?",
    a: "오픽게임 결과 화면에서 '도전장 보내기'로 링크나 인스타 스토리 이미지를 공유하세요. 친구가 링크로 들어와 로그인하면 같은 문제로 대결해요. 받은 도전장은 하루 한도를 쓰지 않아요.",
  },
  {
    q: "예상 등급은 실제 시험 결과와 같나요?",
    a: "AI가 답변을 분석해 추정한 등급이라 실제 시험 결과와 다를 수 있어요. 실력 변화를 확인하는 기준으로 활용해 주세요.",
  },
  {
    q: "구독은 어떻게 해지하나요?",
    a: "iPhone의 설정 → Apple ID → 구독에서 데일리오픽을 선택해 해지할 수 있어요. 해지해도 남은 기간까지는 계속 이용할 수 있어요.",
  },
  {
    q: "환불을 받고 싶어요.",
    a: "App Store에서 결제한 구독은 Apple 정책에 따라 Apple을 통해 환불을 요청할 수 있어요(reportaproblem.apple.com).",
  },
  {
    q: "학습 기록을 다른 기기나 웹에서 볼 수 있나요?",
    a: "지금은 학습 기록이 사용 중인 기기에 저장돼요. 로그인과 기기 간 동기화를 준비하고 있어요.",
  },
  {
    q: "녹음이 안 돼요.",
    a: "iPhone 앱은 설정 → 데일리오픽에서 마이크와 음성 인식 권한을 확인해 주세요. 웹은 주소창의 마이크 권한을 허용하고, 음성 인식이 되는 Chrome · Safari · Edge를 써 주세요.",
  },
];

export function Help() {
  return (
    <div className="page">
      <section className="page-head container" data-reveal>
        <p className="eyebrow">고객센터</p>
        <h1>무엇을 도와드릴까요?</h1>
        <p className="lead">궁금한 점은 아래에서 먼저 찾아보시고, 해결되지 않으면 이메일로 문의해 주세요.</p>
      </section>

      <section className="container contact-card">
        <div>
          <h2>이메일 문의</h2>
          <p>보내주신 순서대로 확인하고 이메일로 답변드려요. 문의할 때 사용 중인 기기와 상황을 함께 적어 주시면 더 빨리 도와드릴 수 있어요.</p>
          <p className="contact-email">{CONTACT_EMAIL}</p>
        </div>
        <a className="button button-primary" href={`mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent("[데일리오픽 문의]")}`}>
          문의 메일 보내기
        </a>
      </section>

      <section className="container faq">
        <h2 className="section-title">자주 묻는 질문</h2>
        {FAQ.map((item) => (
          <details key={item.q}>
            <summary>{item.q}</summary>
            <p>{item.a}</p>
          </details>
        ))}
      </section>
    </div>
  );
}
