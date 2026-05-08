"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { questions, results } from "./data";
import type { LoveDimension } from "./data";
import styles from "./love.module.css";

// A=3(strongly first), B=1(weakly first), C=1(weakly second), D=3(strongly second)
const CHOICE_SCORE = [
  { first: 3, second: 0 },
  { first: 1, second: 0 },
  { first: 0, second: 1 },
  { first: 0, second: 3 },
];

const initAnswers = () => Array<number | null>(questions.length).fill(null);

const calculateResult = (answers: (number | null)[]) => {
  const s: Record<string, number> = { W: 0, C: 0, A: 0, Q: 0 };
  answers.forEach((choiceIdx, qIdx) => {
    if (choiceIdx === null) return;
    const q = questions[qIdx];
    const { first, second } = CHOICE_SCORE[choiceIdx];
    if (q.dimension === "WC") {
      s.W += first;
      s.C += second;
    } else {
      s.A += first;
      s.Q += second;
    }
  });
  return (s.W >= s.C ? "W" : "C") + (s.A >= s.Q ? "A" : "Q");
};

export default function LoveTest() {
  const router = useRouter();
  const [screen, setScreen] = useState<"start" | "test" | "result">("start");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(initAnswers());
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [resultType, setResultType] = useState("");
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const advance = (choice: number, currentAnswers: (number | null)[], qIndex: number) => {
    const newAnswers = [...currentAnswers];
    newAnswers[qIndex] = choice;
    setAnswers(newAnswers);

    if (qIndex + 1 >= questions.length) {
      setResultType(calculateResult(newAnswers));
      setScreen("result");
    } else {
      setCurrentQ(qIndex + 1);
      setSelectedChoice(newAnswers[qIndex + 1] ?? null);
    }
  };

  const handleSelect = (choiceIndex: number, currentAnswers: (number | null)[], qIndex: number) => {
    if (autoAdvanceTimer.current) clearTimeout(autoAdvanceTimer.current);
    setSelectedChoice(choiceIndex);
    advance(choiceIndex, currentAnswers, qIndex);
  };

  const handleNext = () => {
    if (selectedChoice === null) return;
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
    advance(selectedChoice, answers, currentQ);
  };

  const handlePrev = () => {
    if (currentQ === 0) return;
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
    const newAnswers = [...answers];
    newAnswers[currentQ] = selectedChoice;
    setAnswers(newAnswers);
    setCurrentQ(currentQ - 1);
    setSelectedChoice(newAnswers[currentQ - 1] ?? null);
  };

  const restart = () => {
    if (autoAdvanceTimer.current) {
      clearTimeout(autoAdvanceTimer.current);
      autoAdvanceTimer.current = null;
    }
    setScreen("start");
    setCurrentQ(0);
    setAnswers(initAnswers());
    setSelectedChoice(null);
    setResultType("");
  };

  const progress = (currentQ / questions.length) * 100;
  const result = results[resultType];

  return (
    <div className={styles.container}>
      {/* ── 시작 화면 ── */}
      {screen === "start" && (
        <div className={styles.startScreen}>
          <div className={styles.startEmoji}>💘</div>
          <h1 className={styles.startTitle}>이상형 테스트</h1>
          <p className={styles.startDesc}>
            12개의 질문으로 알아보는<br />나의 이상형 유형
          </p>
          <button className={styles.startBtn} onClick={() => setScreen("test")}>
            테스트 시작하기
          </button>
        </div>
      )}

      {/* ── 질문 화면 ── */}
      {screen === "test" && (
        <div className={styles.testScreen}>
          <button className={styles.backToMainLink} onClick={() => router.push("/main")}>
            ← 메인메뉴로
          </button>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <p className={styles.progressText}>{currentQ + 1} / {questions.length}</p>

          <div className={styles.questionCard}>
            <div className={styles.questionImageWrap}>
              <Image
                src={questions[currentQ].img}
                alt={`질문 ${currentQ + 1}`}
                width={560}
                height={220}
                className={styles.questionImage}
                priority
              />
            </div>
            <div className={styles.questionBody}>
              <p className={styles.questionText}>{questions[currentQ].text}</p>
              <div className={styles.choiceList}>
                {questions[currentQ].choices.map((choice, i) => (
                  <button
                    key={i}
                    className={`${styles.choiceBtn} ${selectedChoice === i ? styles.choiceBtnSelected : ""}`}
                    onClick={() => handleSelect(i, answers, currentQ)}
                  >
                    <span className={styles.choiceLabel}>{String.fromCharCode(65 + i)}</span>
                    {choice}
                  </button>
                ))}
              </div>
              <div className={styles.navRow}>
                <button className={styles.prevBtn} onClick={handlePrev} disabled={currentQ === 0}>
                  ← 이전
                </button>
                <button className={styles.nextBtn} onClick={handleNext} disabled={selectedChoice === null}>
                  다음 →
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── 결과 화면 ── */}
      {screen === "result" && result && (
        <div className={styles.resultScreen}>
          <div className={styles.resultEmoji}>{result.emoji}</div>
          <div className={styles.resultType}>{result.title}</div>
          <p className={styles.resultDesc}>{result.description}</p>
          <div className={styles.resultTraits}>
            {result.traits.map((t) => (
              <span key={t} className={styles.traitTag}>{t}</span>
            ))}
          </div>
          <div className={styles.resultTip}>💡 {result.tip}</div>
          <button className={styles.restartBtn} onClick={restart}>다시 테스트하기</button>
          <button className={styles.mainBtn} onClick={() => router.push("/main")}>메인으로 돌아가기</button>
        </div>
      )}
    </div>
  );
}
