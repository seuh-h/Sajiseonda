import { NextRequest, NextResponse } from "next/server";

const GROQ_URL = "https://api.groq.com/openai/v1/chat/completions";
const GROQ_MODEL_QUESTION = "llama-3.1-8b-instant";
const GROQ_MODEL_ANSWER = "llama-3.3-70b-versatile";

export async function POST(request: NextRequest) {
  try {
    const { type, question, answer, solution, situation, hints, mainKeywords, keywordDescriptions, additionalKeywords } =
      await request.json();

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key missing" }, { status: 500 });
    }

    let prompt = "";

    if (type === "question") {
      prompt = `너는 수평사고 퀴즈의 딜러야. 아래 사건의 진실을 완전히 이해하고, 플레이어의 질문을 엄격하게 판단해서 4가지 중 하나만 출력해.

[사건 개요 - 플레이어에게 공개된 정보]
${situation}

[공개된 힌트 - 이 요소들은 모두 사건과 관련 있음]
${Array.isArray(hints) && hints.length > 0 ? hints.map((h: string, i: number) => `${i + 1}. ${h}`).join("\n") : "없음"}

[사건의 완전한 진실]
${solution}

[판단 규칙 - 반드시 이 순서대로 적용]
1. 먼저 이 질문이 사건 해결에 필요한 정보를 묻는지 판단해.
   - 사건과 전혀 무관한 내용(날씨, 외모, 취미 등 사건 해결에 도움 안 되는 것)이면 → "중요하지 않습니다."

2. 질문이 사건과 관련 있다면, 질문에 담긴 모든 주장을 위 진실 기준으로 하나씩 확인해.
   - 질문의 모든 주장이 진실과 일치하면 → "네, 그렇습니다."
   - 질문의 모든 주장이 진실과 다르면 → "아니오, 그렇지 않습니다."
   - 질문 안에 사실인 주장과 거짓인 주장이 동시에 포함되어 있을 때만 → "그럴수도 있습니다."
   (주의: 단순히 질문이 모호하거나 범위가 넓다고 해서 "그럴수도 있습니다"를 쓰면 안 됨. 명확히 사실과 거짓이 섞인 경우만 해당)

[단어 해석 주의사항]
- "실수", "사고", "우연히" 등 행위의 의도성을 묻는 표현은 결과를 기준으로 판단해.
  예: "크리스의 실수로 바이올렛이 사망했나요?", "크리스가 바이올렛을 죽였나요?" → 크리스가 의도치 않게 알레르기 케이크를 가져와 사망에 이르게 한 것이 사실이므로 → "네, 그렇습니다."
- 플레이어가 사용한 단어가 진실의 단어와 정확히 같지 않아도, 의미가 결과적으로 사실과 일치하면 "네"로 답해.
- "~때문에", "~로 인해", "~의 결과로" 같은 인과 표현도 결과가 사실과 맞으면 "네"로 답해.

[중요하지 않습니다 vs 아니오 구분]
- "중요하지 않습니다"는 사건과 완전히 무관한 질문에만 사용해. 예: 날씨, 등장인물의 외모, 취미 등
- 사건과 관련된 요소(케이크, 장소, 등장인물의 행동 등)에 대한 질문은, 그 내용이 사실이 아니더라도 "아니오, 그렇지 않습니다."로 답해.
  예: "케이크 안에 반지가 있었나요?", "케이크에 독이 들어있었나요?" → 사건과 관련된 요소지만 사실이 아니므로 → "아니오, 그렇지 않습니다."
  이 구분이 중요한 이유: 플레이어가 사실이 아닌 가능성을 배제하며 추리하는 데 필요한 정보이기 때문이야.

[플레이어 질문]
"${question}"

위 규칙에 따라 판단한 결과를 아래 4개 중 정확히 하나만 출력해. 다른 말은 절대 하지 마.
- 네, 그렇습니다.
- 아니오, 그렇지 않습니다.
- 그럴수도 있습니다.
- 중요하지 않습니다.`;
    } else if (type === "answer") {
      prompt = `당신은 수평사고 퀴즈의 딜러입니다.
다음은 이 사건의 완전한 진실입니다:
${solution}

추가 키워드: ${additionalKeywords.join(", ")}

플레이어의 정답 시도: "${answer}"

[중요 전제]
- 플레이어는 사건 개요만 보고 추리한 것이라 등장인물의 이름(예: 에이든)을 알 수 없습니다.
- 이름 대신 역할/관계로 표현하면 동일하게 인정합니다. 예: "에이든" = "남자친구" = "크리스의 형(또는 동생)" = "쌍둥이 형제"
- 이름을 모르는 것은 오답 이유가 될 수 없습니다.

[메인 키워드별 판단 기준 - 각 키워드마다 아래 설명을 기준으로 엄격하게 판단하세요]
${mainKeywords.map((kw: string) => `- "${kw}": ${keywordDescriptions?.[kw] ?? kw}`).join("\n")}

[판단 규칙]
1. 각 키워드는 위 설명에 맞는 내용이 답변에 명확하게 포함된 경우에만 found: true입니다.
   단순히 유추 가능하거나 암시만 된 경우는 found: false입니다.
2. 키워드가 언급됐지만 주체나 맥락이 위 설명과 다르면 wrongContext: true입니다.
다음 JSON 형식으로만 답하세요. 다른 텍스트는 절대 포함하지 마세요:
{"keywords": [{"name": "키워드명", "found": true또는false, "wrongContext": true또는false}, ...]}

keywords 배열은 반드시 메인 키워드 목록의 모든 항목을 포함해야 합니다. 빠뜨리지 마세요.`;
    }

    const response = await fetch(GROQ_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: type === "answer" ? GROQ_MODEL_ANSWER : GROQ_MODEL_QUESTION,
        messages: [
          {
            role: "system",
            content: type === "answer"
              ? "너는 수평사고 퀴즈 게임의 채점관이야. 반드시 JSON 형식으로만 답해. 다른 텍스트는 절대 출력하지 마."
              : "너는 수평사고 퀴즈 게임의 딜러야. 주어진 규칙에 따라 정해진 4가지 답변 중 하나만 출력해. 절대로 다른 말을 추가하지 마.",
          },
          { role: "user", content: prompt },
        ],
        temperature: 0.0,
      }),
    });

    if (!response.ok) {
      const errBody = await response.text();
      console.error("Groq API error:", response.status, errBody);
      return NextResponse.json({ error: `Groq API error: ${response.status}`, detail: errBody }, { status: 500 });
    }

    const data = await response.json();
    const raw = (data.choices?.[0]?.message?.content ?? "").trim();

    let result = raw;
    if (type === "question") {
      const t = raw.toLowerCase();
      if (t.includes("그럴수도") || t.includes("그럴 수도")) result = "그럴수도 있습니다.";
      else if (t.includes("중요하지")) result = "중요하지 않습니다.";
      else if (t.includes("아니오") || t.includes("아니요")) result = "아니오, 그렇지 않습니다.";
      else if (t.includes("네") || t.includes("yes") || t.includes("그렇습니다")) result = "네, 그렇습니다.";
    }

    return NextResponse.json({ result });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
