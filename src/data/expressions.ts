// OPIc 답변에서 자주 쓰는 필러 · 연결 표현. 단어 게임(타자 · 뜻 맞추기 · 받아쓰기)의 문제 은행.
export type ExprGroup = "start" | "stall" | "link" | "example" | "time" | "feeling" | "close";

export type Expression = { en: string; ko: string; group: ExprGroup; tip?: string };

export const GROUP_LABEL: Record<ExprGroup, string> = {
  start: "말문 열기",
  stall: "시간 벌기",
  link: "이어 말하기",
  example: "예시 들기",
  time: "시간 · 빈도",
  feeling: "생각 · 감정",
  close: "마무리",
};

export const EXPRESSIONS: Expression[] = [
  // 말문 열기
  { en: "Oh, that's a good question.", ko: "아, 좋은 질문이네요.", group: "start", tip: "질문을 듣고 바로 생각이 안 날 때 첫마디로" },
  { en: "Well, let me think.", ko: "음, 생각해 볼게요.", group: "start" },
  { en: "To be honest,", ko: "솔직히 말하면,", group: "start" },
  { en: "Let me tell you about", ko: "~에 대해 말씀드릴게요", group: "start" },
  { en: "I'd like to talk about", ko: "~에 대해 이야기하고 싶어요", group: "start" },
  { en: "First of all,", ko: "우선,", group: "start" },
  // 시간 벌기
  { en: "You know,", ko: "있잖아요,", group: "stall" },
  { en: "I mean,", ko: "제 말은,", group: "stall" },
  { en: "Let me see.", ko: "어디 보자.", group: "stall" },
  { en: "How can I put it?", ko: "뭐라고 해야 할까요?", group: "stall" },
  { en: "I can't think of the word, but", ko: "단어가 생각 안 나는데,", group: "stall", tip: "막혔을 때 침묵 대신" },
  { en: "Let me put it this way.", ko: "이렇게 말해 볼게요.", group: "stall" },
  { en: "It's kind of hard to explain, but", ko: "설명하기 좀 어렵지만,", group: "stall" },
  { en: "What was it?", ko: "그게 뭐였더라?", group: "stall" },
  // 이어 말하기
  { en: "On top of that,", ko: "게다가,", group: "link" },
  { en: "Speaking of which,", ko: "말이 나온 김에,", group: "link" },
  { en: "That reminds me of", ko: "그러고 보니 ~가 생각나네요", group: "link" },
  { en: "The thing is,", ko: "문제는 / 사실은,", group: "link" },
  { en: "Anyway,", ko: "어쨌든,", group: "link", tip: "옆길로 샜다가 돌아올 때" },
  { en: "Other than that,", ko: "그 외에는,", group: "link" },
  { en: "Not only that, but", ko: "그뿐만 아니라,", group: "link" },
  { en: "Because of that,", ko: "그래서 / 그것 때문에,", group: "link" },
  { en: "As a result,", ko: "그 결과,", group: "link" },
  { en: "On the other hand,", ko: "반면에,", group: "link", tip: "비교 문제(Q11~12)에 특히 유용" },
  // 예시 들기
  { en: "For example,", ko: "예를 들면,", group: "example" },
  { en: "Like I said,", ko: "말씀드렸듯이,", group: "example" },
  { en: "In my case,", ko: "제 경우에는,", group: "example" },
  { en: "Let me give you an example.", ko: "예를 하나 들어 볼게요.", group: "example" },
  { en: "Things like", ko: "~같은 것들", group: "example" },
  { en: "Stuff like that.", ko: "뭐 그런 것들이요.", group: "example" },
  // 시간 · 빈도
  { en: "These days,", ko: "요즘에는,", group: "time" },
  { en: "Back in the day,", ko: "예전에는,", group: "time" },
  { en: "Once in a while,", ko: "가끔,", group: "time" },
  { en: "Every now and then,", ko: "이따금씩,", group: "time" },
  { en: "As far as I remember,", ko: "제 기억으로는,", group: "time", tip: "과거 경험 문제의 첫 문장" },
  { en: "A few years ago,", ko: "몇 년 전에,", group: "time" },
  { en: "Ever since then,", ko: "그때 이후로,", group: "time" },
  { en: "At first,", ko: "처음에는,", group: "time" },
  { en: "In the end,", ko: "결국,", group: "time" },
  // 생각 · 감정
  { en: "I'd say", ko: "제 생각엔 / ~라고 할 수 있죠", group: "feeling" },
  { en: "Personally,", ko: "개인적으로,", group: "feeling" },
  { en: "Believe it or not,", ko: "믿기 어렵겠지만,", group: "feeling" },
  { en: "It was a lot of fun.", ko: "정말 재밌었어요.", group: "feeling" },
  { en: "I was so excited.", ko: "정말 신났어요.", group: "feeling" },
  { en: "It was a total disaster.", ko: "완전 엉망이었어요.", group: "feeling" },
  { en: "What I like most about it is", ko: "제가 가장 좋아하는 점은", group: "feeling" },
  { en: "I'm a big fan of", ko: "저는 ~를 정말 좋아해요", group: "feeling" },
  { en: "It really helps me relax.", ko: "정말 마음이 편해져요.", group: "feeling" },
  // 마무리
  { en: "That's pretty much it.", ko: "대충 그 정도예요.", group: "close" },
  { en: "That's all I can say.", ko: "제가 말할 수 있는 건 여기까지예요.", group: "close" },
  { en: "Long story short,", ko: "간단히 말하면,", group: "close" },
  { en: "All in all,", ko: "대체로 / 결론적으로,", group: "close" },
  { en: "That's why I love it.", ko: "그래서 그걸 좋아해요.", group: "close", tip: "묘사 · 습관 문제를 깔끔하게 끝낼 때" },
  { en: "I hope that answers your question.", ko: "답이 되었으면 좋겠어요.", group: "close" },
];
