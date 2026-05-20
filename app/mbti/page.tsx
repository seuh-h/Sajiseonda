"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { questions, results } from "./data";
import type { Dimension } from "./data";
import styles from "./mbti.module.css";
import ShareResultButtons from "@/components/ShareResultButtons";

// A=3(strongly first), B=1(weakly first), C=1(weakly second), D=3(strongly second)
const CHOICE_SCORE = [
  { first: 3, second: 0 },
  { first: 1, second: 0 },
  { first: 0, second: 1 },
  { first: 0, second: 3 },
];

const DIMENSION_LETTERS: Record<Dimension, [string, string]> = {
  EI: ["E", "I"],
  SN: ["S", "N"],
  TF: ["T", "F"],
  JP: ["J", "P"],
};

const initAnswers = () => Array<number | null>(questions.length).fill(null);

const calculateResult = (answers: (number | null)[]) => {
  const s: Record<string, number> = { E: 0, I: 0, S: 0, N: 0, T: 0, F: 0, J: 0, P: 0 };
  answers.forEach((choiceIdx, qIdx) => {
    if (choiceIdx === null) return;
    const q = questions[qIdx];
    const { first, second } = CHOICE_SCORE[choiceIdx];
    const [fl, sl] = DIMENSION_LETTERS[q.dimension];
    s[fl] += first;
    s[sl] += second;
  });
  return (
    (s.E >= s.I ? "E" : "I") +
    (s.S >= s.N ? "S" : "N") +
    (s.T >= s.F ? "T" : "F") +
    (s.J >= s.P ? "J" : "P")
  );
};

export default function MbtiTest() {
  const router = useRouter();
  const [screen, setScreen] = useState<"start" | "test" | "result">("start");
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(initAnswers());
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [resultType, setResultType] = useState("");
  const autoAdvanceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

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
          <div className={styles.startEmoji}>🧬</div>
          <h1 className={styles.startTitle}>MBTI 테스트</h1>
          <p className={styles.startDesc}>20개의 질문으로 알아보는 나의 성격 유형</p>
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
          <p className={styles.progressText}>
            {currentQ + 1} / {questions.length}
          </p>
          <div className={styles.questionCard}>
            <p className={styles.questionText}>{questions[currentQ].text}</p>
            <div className={styles.choiceList}>
              {questions[currentQ].choices.map((choice, i) => (
                <button
                  key={i}
                  className={`${styles.choiceBtn} ${selectedChoice === i ? styles.choiceBtnSelected : ""}`}
                  onClick={() => handleSelect(i, answers, currentQ)}
                >
                  <span className={styles.choiceLabel}>
                    {String.fromCharCode(65 + i)}
                  </span>
                  {choice}
                </button>
              ))}
            </div>
            <div className={styles.navRow}>
              <button
                className={styles.prevBtn}
                onClick={handlePrev}
                disabled={currentQ === 0}
              >
                ← 이전
              </button>
              <button
                className={styles.nextBtn}
                onClick={handleNext}
                disabled={selectedChoice === null}
              >
                다음 →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── 결과 화면 ── */}
      {screen === "result" && result && (
        <div className={styles.resultScreen}>
          <div ref={resultRef} className="resultCard">
            <div className={styles.resultEmoji}>{result.emoji}</div>
            <div className={styles.resultType}>{result.type}</div>
            <h2 className={styles.resultTitle}>{result.title}</h2>
            <p className={styles.resultDesc}>{result.description}</p>
            <div className={styles.resultGrid}>
              <div className={styles.resultBox}>
                <h3>강점</h3>
                <ul>
                  {result.strengths.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
              <div className={styles.resultBox}>
                <h3>약점</h3>
                <ul>
                  {result.weaknesses.map((w) => (
                    <li key={w}>{w}</li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          <ShareResultButtons
            resultRef={resultRef}
            title={`나의 MBTI는 ${result.type} - ${result.title}`}
            description={result.description}
          />
          <button className={styles.restartBtn} onClick={restart}>
            다시 테스트하기
          </button>
          <button className={styles.mainBtn} onClick={() => router.push("/main")}>
            메인으로 돌아가기
          </button>
        </div>
      )}
    </div>
  );
}
