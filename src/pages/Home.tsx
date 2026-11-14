import type { CSSProperties, ReactNode } from "react";
import { Link } from "react-router-dom";
import { AppStoreButton, Marquee } from "../components/Bits";
import { AnalysisDemo, CountUp, LogoBuild, QuestionDemo, RoutineDemo, VoicePill } from "../components/Demos";
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
const TOPICS = [
  ["🎬", "영화 보기"], ["🎧", "음악 감상"], ["☕", "카페 가기"], ["🛍️", "쇼핑"], ["📚", "독서"],
  ["🍳", "요리"], ["🎮", "게임"], ["📷", "사진 찍기"], ["🎸", "악기 연주"], ["🐶", "반려동물"],
  ["🏃", "조깅"], ["🏋️", "헬스"], ["🏊", "수영"], ["🚴", "자전거"], ["⚽", "축구"],
  ["🧘", "요가"], ["⛰️", "등산"], ["🏖️", "바다 여행"], ["🏕️", "캠핑"], ["✈️", "해외여행"],
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
          <span className="float-chip chip-a" aria-hidden="true">
            <b>IH</b> 예상 등급
          </span>
          <span className="float-chip chip-b" aria-hidden="true">
            🔊 질문 듣기
          </span>
        </h1>

        <div className="wide hero-foot">
          <p className="lead">
            앱을 열면 오늘의 문제가 기다리고 있어요. 직접 말하고 나면 AI가 예상 등급과 고칠 점을 바로 알려줘요.
          </p>
          <div className="hero-actions">
            <AppStoreButton />
            <Link to="/membership" className="button button-ghost">
              요금제 보기
            </Link>
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
        eyebrow="03 · 실전 모의고사"
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

      <Feature
        reverse
        eyebrow="04 · 매일 루틴"
        title="플래너와 단어장으로 꾸준하게"
        points={[
          {
            title: "시험일까지 거꾸로 짜는 플래너",
            body: "연속 학습 기록과 시험 D-day로 오늘 할 분량이 자연스럽게 정해져요.",
          },
          {
            title: "오늘의 단어 20개",
            body: "답변에 바로 쓸 단어 · 표현 · 패턴을 발음과 함께 익혀요.",
          },
        ]}
        media={<RoutineDemo />}
      />

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
                <span aria-hidden="true">{icon}</span>
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
          <AppStoreButton label="무료로 시작하기" />
        </div>
      </section>
    </>
  );
}
