"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { questions, results } from "./data";
import styles from "./alba.module.css";

const calculateResult = (answers: (number | null)[]) => {
  const counts = [0, 0, 0, 0];
  answers.forEach((choiceIdx) => {
    if (choiceIdx !== null) counts[choiceIdx] += 1;
  });
  const maxIndex = counts.indexOf(Math.max(...counts));
  return ["A", "B", "C", "D"][maxIndex];
};

const initAnswers = () => Array<number | null>(questions.length).fill(null);

export default function AlbaTest() {
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

  const handleShare = async (type: string, title: string) => {
    const url = window.location.origin + "/alba";
    const text = `나의 알바생 유형은 ${type} - ${title}이에요!\n사지선다에서 테스트해보세요`;
    if (navigator.share) {
      try { await navigator.share({ title: "K-알바생 멘탈 테스트", text, url }); } catch {}
    } else {
      try {
        await navigator.clipboard.writeText(`${text}\n${url}`);
        alert("링크가 복사됐어요!");
      } catch {
        prompt("링크를 직접 복사해주세요:", `${text}\n${url}`);
      }
    }
  };

  const progress = (currentQ / questions.length) * 100;
  const result = results[resultType];

  return (
    <div className={styles.container}>
      {screen === "start" && (
        <div className={styles.startScreen}>
          <div className={styles.startEmoji}>💸</div>
          <h1 className={styles.startTitle}>K-알바생 멘탈 테스트</h1>
          <p className={styles.startDesc}>당신에게 닥칠 억까 상황 속에서 살아남으세요</p>
          <button className={styles.startBtn} onClick={() => setScreen("test")}>
            테스트 시작하기
          </button>
        </div>
      )}

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
              <button className={styles.prevBtn} onClick={handlePrev} disabled={currentQ === 0}>
                ← 이전
              </button>
              <button className={styles.nextBtn} onClick={handleNext} disabled={selectedChoice === null}>
                다음 →
              </button>
            </div>
          </div>
        </div>
      )}

      {screen === "result" && result && (
        <div className={styles.resultScreen}>
          <div className={styles.resultEmoji}>{result.emoji}</div>
          <div className={styles.resultType}>{result.type} Type</div>
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
          <button className={styles.shareBtn} onClick={() => handleShare(result.type, result.title)}>
            결과 공유하기
          </button>
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
