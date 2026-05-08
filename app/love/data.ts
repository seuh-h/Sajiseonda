export type LoveDimension = "WC" | "AQ";

export interface LoveQuestion {
  id: number;
  dimension: LoveDimension;
  img: string;
  text: string;
  choices: [string, string, string, string];
}

export interface LoveResult {
  type: string;
  emoji: string;
  title: string;
  description: string;
  traits: string[];
  tip: string;
}

// A=strongly first, B=weakly first, C=weakly second, D=strongly second
// WC: first=W(따뜻함), second=C(차가움)
// AQ: first=A(활발함), second=Q(조용함)

export const questions: LoveQuestion[] = [
  // ── W / C ──────────────────────────────────────────────────
  {
    id: 1,
    dimension: "WC",
    img: "/img/love/q1.svg",
    text: "연인이 힘들다고 털어놨을 때, 연인이 원하는 반응은?",
    choices: [
      "아무 말 없이 꼭 안아준다",
      '"많이 힘들었겠다"며 공감해준다',
      "해결책을 같이 고민해준다",
      '"잘 할 수 있어"라며 믿어준다',
    ],
  },
  {
    id: 2,
    dimension: "WC",
    img: "/img/love/q2.svg",
    text: "기념일에 받고 싶은 선물은?",
    choices: [
      "직접 만든 편지나 핸드메이드 선물",
      "내가 좋아하는 것들로 꾸민 이벤트",
      "갖고 싶었던 걸 정확히 알아채서 산 선물",
      "함께하는 여행이나 특별한 액티비티",
    ],
  },
  {
    id: 3,
    dimension: "WC",
    img: "/img/love/q3.svg",
    text: "연인이 감정을 표현하는 방식은?",
    choices: [
      '자주 "사랑해", "보고 싶어"를 말한다',
      "스킨십으로 마음을 전한다",
      "행동으로 보여준다 (먼저 챙겨주기, 배려)",
      "말보다 눈빛과 분위기로 느끼게 한다",
    ],
  },
  {
    id: 4,
    dimension: "WC",
    img: "/img/love/q4.svg",
    text: "싸운 후 화해 방식은?",
    choices: [
      '"미안해"라고 바로 먼저 연락한다',
      "맛있는 것 사주면서 분위기를 풀어간다",
      "충분히 생각한 뒤 조용히 얘기를 꺼낸다",
      "시간이 지나면 자연스럽게 풀리길 기다린다",
    ],
  },
  {
    id: 5,
    dimension: "WC",
    img: "/img/love/q5.svg",
    text: "함께 있을 때 가장 행복한 순간은?",
    choices: [
      '"네가 있어서 다행이야"라는 말을 들을 때',
      "손 잡고 아무 데나 걸을 때",
      "서로 깊은 얘기를 나눌 때",
      "말없이 같은 공간에서 각자 하고 싶은 걸 할 때",
    ],
  },
  {
    id: 6,
    dimension: "WC",
    img: "/img/love/q6.svg",
    text: "연인에게 바라는 연락 빈도는?",
    choices: [
      "하루 종일 틈틈이 연락하는 사이",
      "아침저녁 안부는 꼭 챙기는 사이",
      "중요한 일이 있을 때만 연락하는 사이",
      "보고 싶을 때 연락하는 자유로운 사이",
    ],
  },
  // ── A / Q ──────────────────────────────────────────────────
  {
    id: 7,
    dimension: "AQ",
    img: "/img/love/q7.svg",
    text: "주말 데이트로 가고 싶은 곳은?",
    choices: [
      "놀이공원, 축제, 야외 액티비티",
      "맛집 탐방과 카페 투어",
      "조용한 전시회나 영화관",
      "집에서 같이 요리하거나 영화 보기",
    ],
  },
  {
    id: 8,
    dimension: "AQ",
    img: "/img/love/q8.svg",
    text: "연인과 함께 가고 싶은 여행은?",
    choices: [
      "여러 나라를 돌아다니는 자유 여행",
      "유명 관광지 위주의 알찬 여행",
      "한적한 자연 속 힐링 여행",
      "호텔에서 쉬면서 조용히 보내는 여행",
    ],
  },
  {
    id: 9,
    dimension: "AQ",
    img: "/img/love/q9.svg",
    text: "연인 친구들과 어울리는 건?",
    choices: [
      "자주 같이 어울리는 게 좋다",
      "가끔은 같이 노는 것도 좋다",
      "둘만의 시간이 더 소중하다",
      "각자의 친구는 따로인 게 편하다",
    ],
  },
  {
    id: 10,
    dimension: "AQ",
    img: "/img/love/q10.svg",
    text: "함께하고 싶은 취미는?",
    choices: [
      "등산, 서핑, 클라이밍 같은 운동",
      "맛집 탐방, 쇼핑, 팝업 스토어",
      "독서, 그림, 음악 감상",
      "집에서 게임이나 드라마 보기",
    ],
  },
  {
    id: 11,
    dimension: "AQ",
    img: "/img/love/q11.svg",
    text: "연인이 친구들과 자주 노는 건?",
    choices: [
      "좋다, 활발한 사람이 매력적이다",
      "가끔은 좋지만 나와의 시간도 챙겨줬으면",
      "조금 서운하지만 이해한다",
      "나와 있을 때 가장 편해했으면 좋겠다",
    ],
  },
  {
    id: 12,
    dimension: "AQ",
    img: "/img/love/q12.svg",
    text: "이상적인 데이트 분위기는?",
    choices: [
      "신나고 에너지 넘치는 분위기",
      "둘만의 특별한 이벤트와 설레임",
      "따뜻하고 아늑한 분위기",
      "조용하고 차분하게 서로에게만 집중하는",
    ],
  },
];

export const results: Record<string, LoveResult> = {
  WA: {
    type: "WA",
    emoji: "☀️",
    title: "밝고 다정한 연인",
    description:
      "감정 표현이 풍부하고 에너지 넘치는 사람을 원해. 항상 먼저 '사랑해'라고 말하고, 함께라면 어디든 신나게 만드는 사람. 곁에 있는 것만으로 세상이 더 밝아지는 느낌의 연인이야.",
    traits: ["다정함", "표현력", "활발함", "긍정 에너지"],
    tip: "꾸준한 감정 표현과 함께하는 액티비티가 이 유형의 마음을 가장 잘 움직여.",
  },
  WQ: {
    type: "WQ",
    emoji: "🌿",
    title: "조용하고 따뜻한 연인",
    description:
      "말보다 행동으로 마음을 보여주는 사람을 원해. 시끄럽진 않지만 늘 곁에 있어주는 듯한 안정감. 혼자만의 시간도 중요하게 여기면서, 함께할 때는 깊이 있게 연결되는 사람이야.",
    traits: ["세심함", "안정감", "깊은 배려", "묵직한 신뢰"],
    tip: "억지로 활발하게 구는 것보다 조용히 곁에 있어주는 것이 더 큰 위로가 돼.",
  },
  CA: {
    type: "CA",
    emoji: "⚡",
    title: "쿨하고 자유로운 연인",
    description:
      "감정 표현보다 함께 경험하는 것을 더 중요하게 생각하는 사람을 원해. 자유롭고 독립적이지만, 그 안에서 서로를 인정하는 관계를 추구해. 매력적인 거리감이 있는 사람이야.",
    traits: ["독립성", "자유로움", "자신감", "쿨한 매력"],
    tip: "서로의 공간을 존중하면서 함께 새로운 경험을 쌓는 것이 이 유형과의 핵심이야.",
  },
  CQ: {
    type: "CQ",
    emoji: "🧊",
    title: "지적이고 독립적인 연인",
    description:
      "감정보다 깊이 있는 대화와 상호 존중을 중요하게 여기는 사람을 원해. 혼자서도 충분히 완성된 사람이라, 함께할 때 더 단단한 관계를 만들어. 신뢰와 이해로 쌓아가는 연애 스타일이야.",
    traits: ["지적 대화", "독립성", "상호 존중", "이성적"],
    tip: "억지로 감정을 꺼내기보다, 서로의 생각을 나누는 깊은 대화가 이 유형의 마음을 여는 열쇠야.",
  },
};
