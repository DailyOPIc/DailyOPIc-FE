import type { Survey } from "./api";

// iOS처럼 학습 설정(자가 평가 단계 · 배경 설문)은 기기에 둔다. 서버는 요청마다 받는다.
export type StudyPrefs = { initialLevel: number; survey: Survey };

const key = (uid: string) => `dailyopic:prefs:${uid}`;

export function loadPrefs(uid: string): StudyPrefs | null {
  try {
    const raw = localStorage.getItem(key(uid));
    return raw ? (JSON.parse(raw) as StudyPrefs) : null;
  } catch {
    return null;
  }
}

export function savePrefs(uid: string, prefs: StudyPrefs) {
  try {
    localStorage.setItem(key(uid), JSON.stringify(prefs));
  } catch {
    // 저장이 막힌 브라우저(사생활 모드 등)는 이번 세션만 쓴다.
  }
}

export function clearPrefs(uid: string) {
  try {
    localStorage.removeItem(key(uid));
  } catch {
    /* noop */
  }
}

// iOS OPIcLevel.swift / BackgroundProfile.swift와 같은 값
export const LEVELS = [
  { value: 1, range: "IL", desc: "짧은 한두 문장으로 답해요" },
  { value: 2, range: "IL ~ IM1", desc: "익숙한 주제를 간단히 말해요" },
  { value: 3, range: "IM1", desc: "일상 이야기에 이유를 덧붙여요" },
  { value: 4, range: "IM1 ~ IM2", desc: "경험을 순서대로 설명해요" },
  { value: 5, range: "IM2 ~ IH", desc: "비교와 역할극까지, 실전 수준이에요" },
  { value: 6, range: "IH ~ AL", desc: "복잡한 주제도 자연스럽게 말해요" },
];

type Option = { id: string; label: string };
export const SURVEY = {
  status: [
    { id: "student", label: "학생" },
    { id: "office_worker", label: "직장인" },
    { id: "job_seeker", label: "구직" },
    { id: "status_none", label: "해당 없음" },
  ] as Option[],
  residence: [
    { id: "alone", label: "혼자" },
    { id: "family", label: "가족" },
    { id: "roommates", label: "룸메이트" },
    { id: "dormitory", label: "기숙사" },
    { id: "residence_other", label: "기타" },
  ] as Option[],
  topics: {
    leisure: [
      { id: "movies", label: "영화" },
      { id: "music", label: "음악" },
      { id: "cafes", label: "카페" },
      { id: "shopping", label: "쇼핑" },
      { id: "reading", label: "독서" },
      { id: "cooking", label: "요리" },
      { id: "gaming", label: "게임" },
    ],
    hobbies: [
      { id: "photography", label: "사진" },
      { id: "instruments", label: "악기" },
      { id: "fashion", label: "패션" },
      { id: "pets", label: "반려동물" },
      { id: "it", label: "IT" },
      { id: "sns", label: "SNS" },
    ],
    sports: [
      { id: "jogging", label: "조깅" },
      { id: "gym", label: "헬스" },
      { id: "swimming", label: "수영" },
      { id: "cycling", label: "자전거" },
      { id: "soccer", label: "축구" },
      { id: "yoga", label: "요가" },
      { id: "hiking", label: "등산" },
    ],
    travel: [
      { id: "domestic_travel", label: "국내" },
      { id: "overseas_travel", label: "해외" },
      { id: "beach_travel", label: "바다" },
      { id: "mountain_travel", label: "산" },
      { id: "camping", label: "캠핑" },
      { id: "staycation", label: "호캉스" },
      { id: "food_travel", label: "맛집 여행" },
    ],
  } satisfies Record<"leisure" | "hobbies" | "sports" | "travel", Option[]>,
};

export const TOPIC_GROUPS: { key: keyof typeof SURVEY.topics; label: string }[] = [
  { key: "leisure", label: "여가" },
  { key: "hobbies", label: "취미" },
  { key: "sports", label: "운동" },
  { key: "travel", label: "여행" },
];
