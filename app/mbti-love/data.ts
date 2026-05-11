export type MBTIType =
  | "INTJ" | "INTP" | "ENTJ" | "ENTP"
  | "INFJ" | "INFP" | "ENFJ" | "ENFP"
  | "ISTJ" | "ISFJ" | "ESTJ" | "ESFJ"
  | "ISTP" | "ISFP" | "ESTP" | "ESFP";

export const MBTI_TYPES: MBTIType[] = [
  "INTJ", "INTP", "ENTJ", "ENTP",
  "INFJ", "INFP", "ENFJ", "ENFP",
  "ISTJ", "ISFJ", "ESTJ", "ESFJ",
  "ISTP", "ISFP", "ESTP", "ESFP",
];

export type Dimension = "EI" | "SN" | "TF" | "JP";
export type CompatLevel = "low" | "mid" | "high";
export type DimLetter = "E" | "I" | "S" | "N" | "T" | "F" | "J" | "P";

export interface CompatQuestion {
  id: number;
  dimension: Dimension;
  text: string;
  choices: [string, string, string, string];
  // 0 = first letter compatible (E/S/T/J), 3 = second letter compatible (I/N/F/P)
  scores: [number, number, number, number];
}

export const questions: CompatQuestion[] = [
  // EI (3): 0=E-friendly, 3=I-friendly
  {
    id: 1,
    dimension: "EI",
    text: "연인이 퇴근 후 혼자 쉬고 싶다고 할 때, 나는?",
    choices: [
      "나도 보고 싶어서 찾아가거나 계속 연락한다",
      "잠깐 연락해보고 기다린다",
      "이해하고 각자 시간을 갖는다",
      "연락도 안 하고 충분히 쉬게 둔다",
    ],
    scores: [0, 1, 2, 3],
  },
  {
    id: 2,
    dimension: "EI",
    text: "주말에 연인과 어떤 걸 하고 싶어?",
    choices: [
      "여러 사람이 함께하는 파티나 모임",
      "둘이서 맛집, 카페, 쇼핑",
      "조용한 전시회나 영화관",
      "집에서 둘이 쉬면서 조용히",
    ],
    scores: [0, 1, 2, 3],
  },
  {
    id: 3,
    dimension: "EI",
    text: "연인과의 연락 빈도는?",
    choices: [
      "하루 종일 틈틈이 연락하는 게 좋다",
      "아침저녁 안부는 꼭 챙긴다",
      "중요한 일 있을 때만 연락한다",
      "서로 연락 없어도 불안하지 않다",
    ],
    scores: [0, 1, 2, 3],
  },
  // TF (3): 0=T-friendly, 3=F-friendly
  {
    id: 4,
    dimension: "TF",
    text: "연인과 싸운 직후, 나는?",
    choices: [
      "서로 시간을 두고 각자 생각을 정리한다",
      "충분히 생각한 뒤에 조용히 대화를 꺼낸다",
      "문자로 먼저 사과하거나 감정을 표현한다",
      "바로 전화해서 감정을 털어놓는다",
    ],
    scores: [0, 1, 2, 3],
  },
  {
    id: 5,
    dimension: "TF",
    text: "연인이 힘들다고 털어놓을 때, 나는?",
    choices: [
      "객관적으로 상황을 분석해서 조언해준다",
      "같이 해결책을 고민해본다",
      "이유를 물어보며 감정을 받아준다",
      "먼저 안아주고 '많이 힘들었겠다'며 공감한다",
    ],
    scores: [0, 1, 2, 3],
  },
  {
    id: 6,
    dimension: "TF",
    text: "연인이 실수를 했을 때, 나는?",
    choices: [
      "다음에 어떻게 할지 방법을 이야기한다",
      "왜 그랬는지 이유를 물어본다",
      "'괜찮아?' 하고 연인의 감정을 먼저 살핀다",
      "속상한 감정을 솔직하게 표현한다",
    ],
    scores: [0, 1, 2, 3],
  },
  // SN (2): 0=S-friendly, 3=N-friendly
  {
    id: 7,
    dimension: "SN",
    text: "연인과 대화할 때 주로 어떤 이야기를 해?",
    choices: [
      "요즘 있었던 일, 일상 이야기",
      "맛집, 여행 같은 구체적인 계획",
      "세상 돌아가는 이야기, 사회 문제",
      "미래 꿈, 삶의 의미 같은 깊은 이야기",
    ],
    scores: [0, 1, 2, 3],
  },
  {
    id: 8,
    dimension: "SN",
    text: "연인과 미래 이야기를 할 때 더 좋아하는 것은?",
    choices: [
      "현실적인 계획을 구체적으로 세우는 것",
      "당장 실현 가능한 목표를 정하는 것",
      "큰 꿈이나 방향을 이야기하는 것",
      "상상 속의 이상적인 미래를 그려보는 것",
    ],
    scores: [0, 1, 2, 3],
  },
  // JP (2): 0=J-friendly, 3=P-friendly
  {
    id: 9,
    dimension: "JP",
    text: "연인이 갑자기 약속을 바꾸자고 하면?",
    choices: [
      "많이 당황하고 스트레스받는다",
      "약간 당황하지만 금방 적응한다",
      "그냥 상황에 맞게 흘러가는 편이다",
      "즉흥적인 게 오히려 더 재밌다",
    ],
    scores: [0, 1, 2, 3],
  },
  {
    id: 10,
    dimension: "JP",
    text: "일상 루틴에 대한 나의 생각은?",
    choices: [
      "정해진 루틴대로 사는 게 편하고 안정적이다",
      "큰 틀은 유지하되 유연하게 조정한다",
      "그날그날 기분에 따라 다르게 산다",
      "루틴 없이 자유롭게 사는 게 좋다",
    ],
    scores: [0, 1, 2, 3],
  },
];

export const RESULT_MESSAGES: Record<CompatLevel, { emoji: string; title: string; message: string }> = {
  low: {
    emoji: "💭",
    title: "잘 맞지 않아요",
    message: "잘 맞지 않아요. 조금 더 서로를 이해하고 존중해야해요.",
  },
  mid: {
    emoji: "🌱",
    title: "나쁘지 않아요",
    message: "맞는 것도 있고 서로 이해하지 못하는 것도 있지만 나쁘지는 않아요.",
  },
  high: {
    emoji: "💞",
    title: "천생연분일지도..?",
    message: "천생연분일지도..? 서로 잘 이해할 수 있는 사이인거 같네요.",
  },
};

export const DIMENSION_FEEDBACK: Record<DimLetter, { high: string; low: string }> = {
  E: {
    high: "연인은 활발하고 사교적인 사람이에요. 함께 다양한 활동을 즐기고 적극적으로 먼저 연락하는 지금 모습이 연인에게 잘 맞아요.",
    low: "연인은 사람들과 어울리며 에너지를 충전하는 타입이에요. 연인의 사교적인 활동을 응원해주고, 때로는 새로운 사람들을 만나는 자리에 함께해보는 건 어떨까요?",
  },
  I: {
    high: "연인은 혼자만의 시간이 꼭 필요한 사람이에요. 연인이 쉬고 싶다고 할 때 충분히 배려해주는 지금 모습이 정말 잘 맞아요.",
    low: "연인은 혼자 있는 시간으로 에너지를 충전해요. 너무 자주 연락하거나 만남을 강요하면 부담을 느낄 수 있어요. '혼자 쉬고 싶다'는 말은 거절이 아닌 재충전이에요.",
  },
  S: {
    high: "연인은 현실적이고 구체적인 이야기를 좋아해요. 일상 대화나 세세한 계획을 함께 나누는 지금 방식이 연인과 잘 통해요.",
    low: "연인은 추상적인 이야기보다 지금 눈앞의 현실 이야기를 좋아해요. 너무 먼 미래나 이론보다 오늘 있었던 일, 다음 주 데이트 계획 같은 구체적인 대화를 나눠보세요.",
  },
  N: {
    high: "연인은 상상력이 풍부하고 깊이 있는 대화를 즐겨요. 미래 계획이나 아이디어를 함께 이야기하는 지금 방식이 연인에게 잘 맞아요.",
    low: "연인은 가끔 깊이 있는 이야기나 미래에 대한 꿈을 나누는 걸 좋아해요. '우리 나중에 어떻게 살까?', '버킷리스트 같이 만들어볼까?' 같은 이야기로 연인의 상상력을 자극해주세요.",
  },
  T: {
    high: "연인은 감정보다 논리적인 대화를 선호해요. 문제가 생겼을 때 차분하게 해결책 중심으로 이야기하는 지금 방식이 연인에게 잘 맞아요.",
    low: "연인은 감정 표현보다 논리와 해결을 중시해요. 싸울 때 감정적으로 표현하기보다 '이 부분이 문제인 것 같다'고 차분하게 이야기하면 연인이 훨씬 잘 받아들일 거예요.",
  },
  F: {
    high: "연인은 감정 공감을 매우 중요하게 생각해요. 먼저 공감하고 감정을 받아주는 지금 모습이 연인에게 큰 위로가 될 거예요.",
    low: "연인은 해결책보다 공감을 먼저 원해요. 연인이 힘들다고 할 때 조언보다 '많이 힘들었겠다'는 한 마디가 훨씬 더 커요. 감정을 먼저 받아주는 연습을 해보세요.",
  },
  J: {
    high: "연인은 계획적이고 규칙적인 생활을 선호해요. 약속을 잘 지키고 미리 계획하는 지금 모습이 연인에게 큰 안정감을 줄 거예요.",
    low: "연인은 계획과 규칙을 중요하게 생각해요. 갑작스러운 변경이나 즉흥적인 행동은 스트레스가 될 수 있어요. 약속은 미리, 변경 사항은 최대한 일찍 알려주세요.",
  },
  P: {
    high: "연인은 자유롭고 유연한 생활을 좋아해요. 즉흥적인 변화에도 잘 적응하는 지금 모습이 연인과 잘 어울려요.",
    low: "연인은 계획보다 자유로움을 즐겨요. 모든 걸 미리 정하거나 틀에 맞추려 하면 연인이 답답해할 수 있어요. 가끔은 계획 없이 즉흥적으로 움직여보는 건 어떨까요?",
  },
};

// First letter for each dimension (scores: 0=first letter friendly, 3=second letter friendly)
const DIM_FIRST: Record<Dimension, string> = { EI: "E", SN: "S", TF: "T", JP: "J" };

export function calculateResult(answers: number[], partnerMBTI: MBTIType) {
  const partnerForDim: Record<Dimension, DimLetter> = {
    EI: partnerMBTI[0] as DimLetter,
    SN: partnerMBTI[1] as DimLetter,
    TF: partnerMBTI[2] as DimLetter,
    JP: partnerMBTI[3] as DimLetter,
  };

  const dimScore: Record<Dimension, { compat: number; max: number }> = {
    EI: { compat: 0, max: 0 },
    SN: { compat: 0, max: 0 },
    TF: { compat: 0, max: 0 },
    JP: { compat: 0, max: 0 },
  };

  answers.forEach((choiceIdx, qIdx) => {
    const q = questions[qIdx];
    const rawScore = q.scores[choiceIdx];
    const dim = q.dimension;
    const partnerIsFirst = partnerForDim[dim] === DIM_FIRST[dim];
    const compatScore = partnerIsFirst ? (3 - rawScore) : rawScore;

    dimScore[dim].compat += compatScore;
    dimScore[dim].max += 3;
  });

  const total = Object.values(dimScore).reduce((a, d) => a + d.compat, 0);
  const max = Object.values(dimScore).reduce((a, d) => a + d.max, 0);
  const percentage = (total / max) * 100;
  const level: CompatLevel = percentage < 40 ? "low" : percentage < 70 ? "mid" : "high";

  const feedbacks = (Object.entries(dimScore) as [Dimension, { compat: number; max: number }][]).map(
    ([dim, score]) => {
      const pct = score.max > 0 ? (score.compat / score.max) * 100 : 50;
      const isGood = pct >= 60;
      const letter = partnerForDim[dim];
      return {
        dimension: dim,
        letter,
        text: DIMENSION_FEEDBACK[letter][isGood ? "high" : "low"],
        isGood,
      };
    }
  );

  return { level, percentage, feedbacks };
}
