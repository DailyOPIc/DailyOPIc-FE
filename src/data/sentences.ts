// 문장 조립 · 빈칸 채우기용 OPIc 답변 문장. blank는 문장 속 빈칸 정답(연결어 · 필러).
export type Sentence = { en: string; ko: string; blank: string; options: [string, string, string] };

export const SENTENCES: Sentence[] = [
  { en: "I usually go jogging in the park because it helps me relax.", ko: "보통 공원에서 조깅해요. 긴장을 푸는 데 도움이 되거든요.", blank: "because", options: ["although", "unless", "so that"] },
  { en: "To be honest, I'm not a big fan of shopping malls.", ko: "솔직히 쇼핑몰을 별로 안 좋아해요.", blank: "To be honest,", options: ["In the end,", "For example,", "As a result,"] },
  { en: "On top of that, the coffee there is really good.", ko: "게다가 거기 커피가 정말 맛있어요.", blank: "On top of that,", options: ["At first,", "Long story short,", "Let me see."] },
  { en: "As far as I remember, it was my first trip abroad.", ko: "제 기억으로는 그게 첫 해외여행이었어요.", blank: "As far as I remember,", options: ["On the other hand,", "Other than that,", "That's pretty much it."] },
  { en: "These days, I watch movies at home more often.", ko: "요즘에는 집에서 영화를 더 자주 봐요.", blank: "These days,", options: ["Back in the day,", "In my case,", "All in all,"] },
  { en: "Back in the day, people used to call each other a lot.", ko: "예전에는 사람들이 서로 전화를 많이 했어요.", blank: "Back in the day,", options: ["These days,", "Anyway,", "Personally,"] },
  { en: "On the other hand, my brother prefers the mountains.", ko: "반면에 제 동생은 산을 더 좋아해요.", blank: "On the other hand,", options: ["Because of that,", "First of all,", "Ever since then,"] },
  { en: "For example, I cook pasta with my roommate on Sundays.", ko: "예를 들면 일요일마다 룸메이트랑 파스타를 만들어요.", blank: "For example,", options: ["In the end,", "The thing is,", "As a result,"] },
  { en: "At first, I was nervous, but I enjoyed it in the end.", ko: "처음엔 긴장했지만 결국 즐겼어요.", blank: "At first,", options: ["These days,", "Speaking of which,", "Like I said,"] },
  { en: "Long story short, we missed the last train.", ko: "간단히 말하면 막차를 놓쳤어요.", blank: "Long story short,", options: ["First of all,", "Believe it or not,", "Once in a while,"] },
  { en: "Believe it or not, I had never been to the beach before.", ko: "믿기 어렵겠지만 그전엔 바다에 가 본 적이 없었어요.", blank: "Believe it or not,", options: ["For example,", "Other than that,", "In my case,"] },
  { en: "Ever since then, I always check the weather first.", ko: "그때 이후로 저는 항상 날씨부터 확인해요.", blank: "Ever since then,", options: ["Back in the day,", "To be honest,", "On top of that,"] },
  { en: "I go to the gym three times a week, so I feel healthier.", ko: "일주일에 세 번 헬스장에 가서 더 건강해진 느낌이에요.", blank: "so", options: ["but", "unless", "although"] },
  { en: "The thing is, the café gets really crowded on weekends.", ko: "문제는 주말엔 그 카페가 정말 붐빈다는 거예요.", blank: "The thing is,", options: ["Let me see.", "At first,", "All in all,"] },
  { en: "Speaking of which, I also like taking pictures of food.", ko: "말이 나온 김에, 저는 음식 사진 찍는 것도 좋아해요.", blank: "Speaking of which,", options: ["In the end,", "Long story short,", "First of all,"] },
  { en: "Once in a while, I go camping with my family.", ko: "가끔 가족이랑 캠핑을 가요.", blank: "Once in a while,", options: ["Ever since then,", "On the other hand,", "As a result,"] },
  { en: "In my case, I prefer to study at a quiet café.", ko: "제 경우엔 조용한 카페에서 공부하는 걸 좋아해요.", blank: "In my case,", options: ["Believe it or not,", "Back in the day,", "That's all I can say."] },
  { en: "As a result, I had to buy a new phone.", ko: "그 결과 새 휴대폰을 사야 했어요.", blank: "As a result,", options: ["For example,", "To be honest,", "Every now and then,"] },
  { en: "All in all, it was a trip I will never forget.", ko: "대체로 절대 잊지 못할 여행이었어요.", blank: "All in all,", options: ["At first,", "These days,", "Speaking of which,"] },
  { en: "I like this place, but it is a little far from my house.", ko: "이곳이 좋긴 한데 집에서 조금 멀어요.", blank: "but", options: ["because", "so", "since"] },
  { en: "Let me see, I think it was about three years ago.", ko: "어디 보자, 한 3년 전이었던 것 같아요.", blank: "Let me see,", options: ["In the end,", "Personally,", "On top of that,"] },
  { en: "That's why I love spending time in nature.", ko: "그래서 저는 자연에서 시간 보내는 걸 좋아해요.", blank: "That's why", options: ["Even though", "Unless", "Whereas"] },
  { en: "Personally, I think online shopping is more convenient.", ko: "개인적으로 온라인 쇼핑이 더 편리하다고 생각해요.", blank: "Personally,", options: ["Back in the day,", "As a result,", "Once in a while,"] },
  { en: "Anyway, that's how I spend my weekends.", ko: "어쨌든 그게 제가 주말을 보내는 방법이에요.", blank: "Anyway,", options: ["For example,", "At first,", "Believe it or not,"] },
];
