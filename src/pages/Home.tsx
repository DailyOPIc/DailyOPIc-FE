import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import { AppStoreButton, Marquee } from "../components/Bits";
import { AnalysisDemo, BoardDemo, CountUp, GamesDemo, LogoBuild, QuestionDemo, VersusDemo, VoicePill } from "../components/Demos";
import { Icon, type IconName } from "../assets/Icon";
import { REVIEWS, type Review } from "../site";

const GRADES = ["NL", "NM", "NH", "IL", "IM1", "IM2", "IM3", "IH", "AL"];

const KEYWORDS = [
  "오늘의 문제 Q2~Q15",
  "질문 듣기",
  "3분 실전 답변",
  "OPIc 예상 등급",
  "잘한 점 · 개선할 점",
  "모범 답안",
  "실전 모의고사",
  "시험일 역산 플래너",
  "오늘의 단어 20개",
  "연속 학습 기록",
];

// 앱 배경 설문의 실제 주제(BackgroundProfile.swift)
const TOPICS: [IconName, string][] = [
  ["star", "영화 보기"], ["headphones", "음악 감상"], ["chat", "카페 가기"], ["gem", "쇼핑"], ["book", "독서"],
  ["flame", "요리"], ["keyboard", "게임"], ["sparkle", "사진 찍기"], ["soundOn", "악기 연주"], ["heart", "반려동물"],
  ["timer", "조깅"], ["bolt", "헬스"], ["target", "수영"], ["rocket", "자전거"], ["trophy", "축구"],
  ["hand", "요가"], ["compare", "등산"], ["phone", "바다 여행"], ["chest", "캠핑"], ["clipboard", "해외여행"],
];

// OPIc 유형의 질문 예시. 첫 문장은 실제 앱 화면에 나온 질문이다.
const QUESTIONS = [
  "Describe a place on campus where you like to sit for a few minutes.",
  "Tell me about the café you often go to.",
  "What kind of music do you usually listen to?",
  "Describe your home and the room you like most.",
  "Talk about a memorable trip you took recently.",
  "How has the way people watch movies changed?",
  "Describe a typical day when you go jogging.",
  "Tell me about a problem you had while shopping.",
];

// 실제 결과 화면(개선할 점)에 나온 피드백과 같은 형식의 문장들
const FEEDBACK = [
  "과제에 맞는 장소와 이유를 반드시 말하기",
  "한 문장으로 끝내지 말고 세부 정보 2~3개 더하기",
  "because, and, also로 답을 늘리기",
  "과거 경험은 과거 시제로 일관되게",
  "구체적인 예시 하나로 마무리하기",
  "질문의 핵심 단어를 첫 문장에서 다시 쓰기",
];

const WORDMARK = "DailyOPIc".split("");

function ReviewCard({ review }: { review: Review }) {
  return (
    <article className="review">
      {review.rating && (
        <p className="stars" aria-label={`별점 ${review.rating}점`}>
          {"★".repeat(review.rating)}
          <span className="stars-off">{"★".repeat(5 - review.rating)}</span>
        </p>
      )}
      {review.title && <h3>{review.title}</h3>}
      <p className={review.title ? undefined : "review-quote"}>{review.body}</p>
      <p className="review-meta">
        {review.author} · {review.source}
      </p>
    </article>
  );
}

type FeatureProps = {
  eyebrow: string;
  title: string;
  points: { title: string; body: string }[];
  media: ReactNode;
  reverse?: boolean;
};

function Feature({ eyebrow, title, points, media, reverse }: FeatureProps) {
  return (
    <section className={`feature${reverse ? " feature-reverse" : ""}`}>
      <div className="container feature-inner">
        <div className="feature-copy" data-reveal>
          <p className="eyebrow">{eyebrow}</p>
          <h2>{title}</h2>
          <ul className="points">
            {points.map((p) => (
              <li key={p.title}>
                <h3>{p.title}</h3>
                <p>{p.body}</p>
              </li>
            ))}
          </ul>
        </div>
        <div className="feature-media">{media}</div>
      </div>
    </section>
  );
}

export function Home() {
  return (
    <>
      <section className="hero">
        <Marquee label="" speed={60} className="hero-backdrop">
          {["SPEAK", "EVERY", "DAY", "OPIc"].map((w) => (
            <span key={w}>{w}</span>
          ))}
        </Marquee>
        <h1 className="hero-title">
          <span className="hl hl-1">
            매일 <VoicePill /> 말하며
          </span>
          <span className="hl hl-2">
            <LogoBuild className="logo-inline" />
            준비하는 <span className="accent">OPIc</span>
          </span>
        </h1>

        <div className="wide hero-foot">
          <p className="lead">
            매일 새 문제에 직접 말하고, 바로 피드백 받고, 게임처럼 별과 경험치를 모아요. 친구와 기록 대결까지, 웹에서 무료로 시작해요.
          </p>
          <div className="hero-cta">
            <Link to="/study" className="chunky chunky-primary">
              무료로 시작하기
            </Link>
            <Link to="/login" className="chunky chunky-ghost">
              이미 계정이 있어요
            </Link>
            <AppStoreButton label="iPhone 앱" />
          </div>
        </div>

        <div className="stats">
          <div className="stat">
            <span className="stat-label">누적 다운로드</span>
            <strong>
              <CountUp to={2600} suffix="+" />
            </strong>
          </div>
          <div className="stat">
            <span className="stat-label">매일 받는 실전 문항</span>
            <strong>
              <CountUp to={14} suffix="문항" />
            </strong>
          </div>
          <div className="stat">
            <span className="stat-label">AI가 분석하는 영역</span>
            <strong>
              <CountUp to={5} suffix="개 영역" />
            </strong>
          </div>
        </div>
        <p className="wide stats-note">누적 다운로드: App Store Connect 첫 다운로드 기준(2026.11.12)</p>
      </section>

      <section className="wordmark" aria-label="DailyOPIc">
        <p className="wordmark-letters" data-reveal aria-hidden="true">
          {WORDMARK.map((ch, n) => (
            <span key={n} className={n >= 5 ? "strong" : undefined} style={{ "--i": n } as CSSProperties}>
              {ch}
            </span>
          ))}
        </p>
        <p className="wordmark-sub" data-reveal>
          하루 10분, 말하기가 습관이 되는 OPIc 루틴
        </p>
      </section>

      <Feature
        eyebrow="01 · 오늘의 문제"
        title="고민 없이, 매일 새 문제로 시작"
        points={[
          {
            title: "나에게 맞춘 Q2~Q15",
            body: "배경 설문과 목표 등급에 맞춰 실제 시험 순서 그대로 문제가 준비돼요.",
          },
          {
            title: "듣고, 바로 말하기",
            body: "질문을 듣고 마이크를 누르면 끝. 3분 안에 실전처럼 답해요.",
          },
        ]}
        media={<QuestionDemo />}
      />

      <Feature
        reverse
        eyebrow="02 · AI 분석"
        title="말하고 나면, 피드백은 바로"
        points={[
          {
            title: "OPIc 예상 등급",
            body: "내 답변이 지금 어느 등급인지, 목표까지 얼마나 남았는지 한눈에 보여줘요.",
          },
          {
            title: "5개 영역 · 잘한 점 · 개선할 점",
            body: "과제 충족부터 유창성까지, 다음 답변에서 바로 쓸 수 있는 교정을 받아요.",
          },
        ]}
        media={<AnalysisDemo />}
      />

      <Feature
        eyebrow="03 · 게임처럼"
        title="한 문항씩, 별과 경험치를 모아요"
        points={[
          {
            title: "학습 판 · 보물상자 · 연속 기록",
            body: "오늘의 세트를 판 위에서 한 칸씩 채워요. 5문항마다 보물상자, 매일 연속 학습 불꽃이 커져요.",
          },
          {
            title: "말하면 바로 별 3개 체크",
            body: "단어 수 · 속도 · 연결어를 바로 확인하는 간단 체크는 무료예요. 정밀 진단만 토큰을 써요.",
          },
        ]}
        media={<BoardDemo />}
      />

      <Feature
        reverse
        eyebrow="04 · 오픽게임 7종"
        title="답변에 바로 쓰는 표현을 놀이로"
        points={[
          {
            title: "타자 · 뜻 맞추기 · 문장 조립 · 받아쓰기",
            body: "To be honest, On top of that 같은 OPIc 필러 54개를 7가지 게임으로 익혀요.",
          },
          {
            title: "PC는 타자로, 휴대폰은 탭과 키보드로",
            body: "한컴타자처럼 따라 치고, 60초 스피드 퀴즈로 순발력도 키워요.",
          },
        ]}
        media={<GamesDemo />}
      />

      <Feature
        eyebrow="05 · 기록 대결"
        title="같은 문제로 친구와 한판"
        points={[
          {
            title: "도전장 링크 하나로",
            body: "결과 화면에서 링크를 보내면 친구가 로그인하고 똑같은 문제로 도전해요. 점수 비교는 바로!",
          },
          {
            title: "인스타 스토리로 자랑하기",
            body: "결과 카드를 스토리 이미지로 만들어 올려요. 오늘의 챌린지는 모두가 같은 문제예요.",
          },
        ]}
        media={<VersusDemo />}
      />

      <Feature
        reverse
        eyebrow="06 · 실전 모의고사 · iPhone 앱"
        title="시험 전엔 실전과 같은 흐름으로"
        points={[
          {
            title: "설문부터 난이도 조정까지",
            body: "사전 설문, 난이도 선택, 중간 난이도 조정까지 실제 시험 순서 그대로 응시해요.",
          },
          {
            title: "NL부터 AL까지",
            body: "전 문항을 마치면 종합 예상 등급과 문항별 피드백을 받아요.",
          },
        ]}
        media={
          <div className="grade-card" aria-label="OPIc 등급 단계" data-reveal>
            <p className="grade-card-title">OPIc 9단계 등급</p>
            <ol className="grades">
              {GRADES.map((g, n) => (
                <li key={g} className={g === "IH" ? "is-target" : undefined} style={{ "--i": n } as CSSProperties}>
                  {g}
                </li>
              ))}
            </ol>
            <p className="grade-card-foot">목표 등급을 정하면 난이도와 피드백이 그에 맞춰져요.</p>
          </div>
        }
      />

      <section className="free-plan">
        <div className="wide free-inner">
          <div className="free-head" data-reveal>
            <p className="eyebrow">무료로 이만큼, 매일 새로</p>
            <h2>
              돈 없이도 <span className="accent">매일</span> 할 게 있어요
            </h2>
            <p className="lead">문제와 무료 횟수는 매일 자정(한국 시간)에 새로 채워져요.</p>
          </div>
          <div className="free-cards">
            <div className="free-card" data-reveal>
              <Icon name="mic" size={44} />
              <strong>언제나 무료</strong>
              <ul>
                <li>학습 단계 하루 10단계</li>
                <li>보물상자 · 하루 목표로 토큰 추가</li>
                <li>친구가 보낸 도전장 대결</li>
              </ul>
            </div>
            <div className="free-card" data-reveal style={{ "--reveal-delay": "100ms" } as CSSProperties}>
              <Icon name="dice" size={44} />
              <strong>매일 무료</strong>
              <ul>
                <li>오픽게임 게임마다 하루 5판</li>
                <li>AI 분석 데일리 토큰 1개</li>
                <li>레벨 · 연속 학습 기록</li>
              </ul>
            </div>
            <div className="free-card plus" data-reveal style={{ "--reveal-delay": "200ms" } as CSSProperties}>
              <Icon name="gem" size={44} />
              <strong>베이직부터</strong>
              <ul>
                <li>학습 단계 제한 없이 이어서</li>
                <li>AI 분석 토큰 매일 3~20개</li>
                <li>교정 · 모범 답안까지 결과 전체</li>
              </ul>
              <Link to="/membership" className="text-link">
                요금제 보기 →
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="practice-wall">
        <div className="container section-head" data-reveal>
          <p className="eyebrow">매일 말하는 연습</p>
          <h2>내 관심사로, 실전 같은 질문을</h2>
          <p className="lead">배경 설문에서 고른 주제로 문제가 나오고, 답변마다 바로 쓸 수 있는 피드백이 돌아와요.</p>
        </div>
        <div className="marquee-rows">
          <Marquee label="설문 주제" speed={50}>
            {TOPICS.map(([icon, label]) => (
              <span key={label} className="tile tile-topic">
                <Icon name={icon} size={26} />
                {label}
              </span>
            ))}
          </Marquee>
          <Marquee label="질문 예시" speed={70} reverse>
            {QUESTIONS.map((q) => (
              <span key={q} className="tile tile-question">
                <span className="tile-q">Q</span>
                {q}
              </span>
            ))}
          </Marquee>
          <Marquee label="AI 피드백 예시" speed={55}>
            {FEEDBACK.map((f) => (
              <span key={f} className="tile tile-feedback">
                <span className="tile-check" aria-hidden="true" />
                {f}
              </span>
            ))}
            {KEYWORDS.map((k) => (
              <span key={k} className="tile tile-keyword">
                {k}
              </span>
            ))}
          </Marquee>
        </div>
      </section>

      <section className="reviews">
        <div className="container section-head" data-reveal>
          <p className="eyebrow">사용자 후기</p>
          <h2>먼저 써본 분들의 이야기</h2>
        </div>
        {REVIEWS.length >= 3 ? (
          <Marquee label="사용자 후기" speed={60}>
            {/* 후기가 적을 때 넓은 화면에서 빈칸이 생기지 않도록 한 줄 안에서 한 번 더 반복한다. */}
            {[...REVIEWS, ...REVIEWS].map((r, n) => (
              <ReviewCard key={n} review={r} />
            ))}
          </Marquee>
        ) : (
          <div className="container review-list" data-reveal>
            {REVIEWS.map((r) => (
              <ReviewCard key={r.body} review={r} />
            ))}
          </div>
        )}
        <p className="container review-note">개인의 경험이며, 결과는 사람마다 다를 수 있어요.</p>
      </section>

      <section className="finale" data-reveal>
        <Marquee label="" speed={28} className="finale-line">
          {["오늘의 문제, 지금 말해보세요", "매일 10분 스피킹 루틴"].map((t) => (
            <span key={t}>
              {t}
              <i aria-hidden="true">✦</i>
            </span>
          ))}
        </Marquee>
        <Marquee label="" speed={34} reverse className="finale-line finale-outline">
          {["SPEAK EVERY DAY", "DailyOPIc", "IL → IM → IH → AL"].map((t) => (
            <span key={t}>
              {t}
              <i aria-hidden="true">✦</i>
            </span>
          ))}
        </Marquee>
        <div className="wide finale-foot">
          <LogoBuild className="logo-finale" />
          <p>
            무료로 시작하고,
            <br />
            필요할 때만 업그레이드하세요.
          </p>
          <div className="finale-actions">
            <Link to="/study" className="button button-primary">
              웹에서 무료로 시작
            </Link>
            <AppStoreButton label="App Store" />
          </div>
        </div>
      </section>
    </>
  );
}
