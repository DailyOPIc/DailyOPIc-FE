// 사이트 전역 상수. 바뀌면 여기 한 곳만 고친다.
export const APP_STORE_URL = "https://apps.apple.com/kr/app/daily-opic/id6756842982";
export const CONTACT_EMAIL = "mark77234@naver.com";

export const BUSINESS = {
  name: "이병찬",
  owner: "이병찬",
  address: "부산광역시 북구 낙동북로 737, 106동 101호(구포동, 유림노르웨이숲)",
  registration: "532-32-01905",
  mailOrder: "미신고", // ponytail: 웹 결제 오픈 전 통신판매업 신고 후 번호로 교체
  phone: "010-7723-4412",
  email: CONTACT_EMAIL,
};

export type Plan = {
  id: "free" | "basic" | "plus" | "pro";
  name: string;
  price: string;
  tagline: string;
  benefits: string[];
  featured?: boolean;
};

// iOS PaywallPlan.swift와 같은 혜택, App Store 가격(2026-09-01 적용분)과 같은 가격.
export const PLANS: Plan[] = [
  {
    id: "free",
    name: "무료",
    price: "0원",
    tagline: "가볍게 시작해 보기",
    benefits: [
      "매일 오늘의 문제 세트",
      "데일리 토큰 1개 (앱에서 광고 시청 시 1개 더)",
      "예상 등급 · 강점 · 개선점 피드백",
      "모의고사 1회 체험",
      "학습 캘린더 · 연속 학습 기록",
    ],
  },
  {
    id: "basic",
    name: "베이직",
    price: "3,900원",
    tagline: "매일 꾸준히 준비",
    benefits: [
      "매일 데일리 토큰 3개",
      "결과 전체 해제 — 교정 답안 · 모범 답안 · 목표 등급까지",
      "모의고사 매일 1회",
      "놓친 학습을 반영한 자동 일정 재조정",
      "광고 없음",
    ],
  },
  {
    id: "plus",
    name: "플러스",
    price: "6,900원",
    tagline: "시험 전 집중 준비",
    featured: true,
    benefits: [
      "매일 데일리 토큰 10개",
      "베이직의 결과 분석 그대로",
      "모의고사 하루 3회",
      "최근 평가를 반영한 학습 계획",
      "시험일까지 역산한 일정 조정",
    ],
  },
  {
    id: "pro",
    name: "프로",
    price: "9,900원",
    tagline: "가장 많이 연습하기",
    benefits: [
      "매일 데일리 토큰 20개",
      "플러스의 결과 분석 그대로",
      "모의고사 하루 5회",
      "플러스의 학습 일정 기능 그대로",
      "광고 없음",
    ],
  },
];

export type Review = {
  body: string;
  author: string; // 익명 표기(예: "대학생 K")
  source: "App Store" | "베타 테스터";
  title?: string;
  rating?: number; // 실제로 받은 별점만. 없으면 별을 그리지 않는다.
};

// 실제로 받은 후기만 넣는다(지어낸 후기는 표시광고법 위반).
// "베타 테스터"는 운영자 지인에게 직접 들은 피드백 — 관계 표시가 필요해 출처로 남긴다.
// 3개 이상이 되면 랜딩 후기 섹션이 자동으로 가로 무한 스크롤로 바뀐다.
export const REVIEWS: Review[] = [
  { title: "학원 다니려다가 그냥 이거함", body: "괜찮네요 학원비 잘 아낍니다", rating: 5, author: "사용자1926", source: "App Store" },
  // 운영자가 지인에게 직접 들은 피드백(2026-11 전달). 들은 내용 이상으로 구체화하지 않는다.
  { body: "OPIc 등급 올리는 데 실제로 도움이 됐어요.", author: "익명", source: "베타 테스터" },
  { body: "연습하면서 나온 예상 등급이 실제 시험에서도 그대로 나왔어요.", author: "익명", source: "베타 테스터" },
  { body: "분석이 생각보다 훨씬 상세해서 뭘 고쳐야 할지 바로 알 수 있었어요.", author: "익명", source: "베타 테스터" },
];
