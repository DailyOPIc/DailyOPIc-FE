// 랜덤 스피킹(무료) 문제 은행. 배경 설문의 topicId와 묶어 내 관심사 위주로 뽑는다.
// style은 서버 QuestionStyle과 같은 값.
export type Prompt = { topic: string; style: "description" | "routine" | "past_experience" | "comparison" | "roleplay" | "opinion"; en: string };

export const PROMPTS: Prompt[] = [
  // 사는 곳(모두 공통)
  { topic: "home", style: "description", en: "Describe your home. What does it look like, and which room do you like the most?" },
  { topic: "home", style: "routine", en: "What do you usually do at home on weekends? Tell me about your typical routine." },
  { topic: "home", style: "past_experience", en: "Tell me about a time something went wrong at home. What happened and how did you handle it?" },
  { topic: "home", style: "comparison", en: "Compare the home you lived in as a child with the home you live in now." },
  // 여가
  { topic: "movies", style: "description", en: "Tell me about your favorite kind of movie. Why do you like it?" },
  { topic: "movies", style: "past_experience", en: "Describe the most memorable movie you have ever seen. When and who did you see it with?" },
  { topic: "movies", style: "comparison", en: "How is watching movies at home different from watching them at a theater?" },
  { topic: "music", style: "routine", en: "When and where do you usually listen to music? Describe your routine." },
  { topic: "music", style: "past_experience", en: "Tell me about the first time you got really into a singer or a band." },
  { topic: "cafes", style: "description", en: "Describe a café you often go to. What does it look like, and why do you like it?" },
  { topic: "cafes", style: "roleplay", en: "You want to reserve a space at a café for a small meeting. Call the café and ask three or four questions." },
  { topic: "shopping", style: "routine", en: "How do you usually shop? Do you prefer going to stores or shopping online?" },
  { topic: "shopping", style: "past_experience", en: "Tell me about a problem you had while shopping. What happened and how did you solve it?" },
  { topic: "reading", style: "description", en: "What kind of books do you like to read? Tell me about a book you enjoyed recently." },
  { topic: "cooking", style: "routine", en: "Tell me about a dish you often cook. How do you make it, step by step?" },
  { topic: "gaming", style: "past_experience", en: "Describe a memorable moment while playing a game with your friends." },
  // 취미
  { topic: "photography", style: "description", en: "What do you like to take pictures of? Describe one of your favorite photos." },
  { topic: "instruments", style: "past_experience", en: "Tell me how you first started learning a musical instrument." },
  { topic: "pets", style: "description", en: "Describe a pet you have or would like to have. What is it like?" },
  { topic: "it", style: "comparison", en: "How has the technology you use every day changed compared to a few years ago?" },
  { topic: "sns", style: "opinion", en: "What are the good and bad points of social media? Tell me what you think." },
  // 운동
  { topic: "jogging", style: "routine", en: "Describe a typical day when you go jogging. Where do you go and how long do you run?" },
  { topic: "gym", style: "routine", en: "Tell me about your workout routine at the gym." },
  { topic: "swimming", style: "past_experience", en: "Tell me about the first time you learned how to swim." },
  { topic: "cycling", style: "description", en: "Describe a place where you like to ride a bike. What can you see there?" },
  { topic: "yoga", style: "routine", en: "How did you get into yoga, and what does a usual session look like for you?" },
  { topic: "hiking", style: "past_experience", en: "Tell me about a memorable hiking trip. What made it special?" },
  { topic: "soccer", style: "past_experience", en: "Describe an exciting soccer match you played or watched." },
  // 여행
  { topic: "domestic_travel", style: "description", en: "Describe a place in your country that you like to travel to." },
  { topic: "overseas_travel", style: "past_experience", en: "Tell me about a trip abroad. Where did you go, and what was the most memorable part?" },
  { topic: "overseas_travel", style: "roleplay", en: "Your flight has been canceled. Call the airline, explain the situation, and suggest two alternatives." },
  { topic: "beach_travel", style: "comparison", en: "Do you prefer going to the beach or the mountains? Compare the two." },
  { topic: "camping", style: "routine", en: "What do you usually prepare before going camping? Walk me through it." },
  { topic: "staycation", style: "description", en: "Describe a hotel you stayed at for a staycation. What did you do there?" },
  { topic: "food_travel", style: "past_experience", en: "Tell me about a trip you took mainly to eat good food." },
  // 돌발(모두 공통)
  { topic: "any", style: "description", en: "Describe the weather in your country. How does it change through the seasons?" },
  { topic: "any", style: "past_experience", en: "Tell me about a time you had to deal with an unexpected problem at work or school." },
  { topic: "any", style: "comparison", en: "How have people's eating habits changed over the past ten years?" },
  { topic: "any", style: "opinion", en: "What is a recent issue in your country that people are talking about? Why is it important?" },
  { topic: "any", style: "roleplay", en: "Your friend invited you to a party, but you can't go. Call your friend, explain why, and suggest another plan." },
  { topic: "any", style: "description", en: "Describe your neighborhood. What are some of your favorite places there?" },
  { topic: "any", style: "routine", en: "Tell me about your morning routine on a typical weekday." },
];

export const STYLE_LABEL: Record<Prompt["style"], string> = {
  description: "묘사",
  routine: "루틴",
  past_experience: "경험",
  comparison: "비교",
  roleplay: "롤플레이",
  opinion: "의견",
};
