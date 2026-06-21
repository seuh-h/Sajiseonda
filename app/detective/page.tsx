"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { recordSuccess } from "@/lib/levelSystem";
import { questions, results } from "./data";
import styles from "./detective.module.css";
import ShareResultButtons from "@/components/ShareResultButtons";

const calculateResult = (answers: (number | null)[]) => {
  let score = 0;
  answers.forEach((choiceIdx, index) => {
    if (choiceIdx !== null && choiceIdx === questions[index].correctIndex) score += 1;
  });
  if (score >= 9) return "전설의 명탐정";
  if (score >= 6) return "노련한 수사관";
  if (score >= 3) return "초보 탐정";
  return "구경꾼";
};

const initAnswers = () => Array<number | null>(questions.length).fill(null);

export default function DetectivePage() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
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
      if (user) recordSuccess(user.id, 'detective');
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
    advance(selectedChoice, answers, currentQ);
  };

  const handlePrev = () => {
    if (currentQ === 0) return;
    const newAnswers = [...answers];
    newAnswers[currentQ] = selectedChoice;
    setAnswers(newAnswers);
    setCurrentQ(currentQ - 1);
    setSelectedChoice(newAnswers[currentQ - 1] ?? null);
  };

  const restart = () => {
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
      {screen === "start" && (
        <div className={styles.startScreen}>
          <div className={styles.startEmoji}>🔍</div>
          <h1 className={styles.startTitle}>{t.detective.title}</h1>
          <p className={styles.startDesc}>{t.detective.desc}</p>
          <button className={styles.startBtn} onClick={() => setScreen("test")}>
            {t.detective.startBtn}
          </button>
        </div>
      )}

      {screen === "test" && (
        <div className={styles.testScreen}>
          <button className={styles.backToMainLink} onClick={() => router.push("/main")}>
            {t.common.backToMainMenu}
          </button>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <p className={styles.progressText}>
            {t.detective.progress.replace('{cur}', String(currentQ + 1)).replace('{total}', String(questions.length))}
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
                  <span className={styles.choiceLabel}>{String.fromCharCode(65 + i)}</span>
                  {choice}
                </button>
              ))}
            </div>
            <div className={styles.navRow}>
              <button className={styles.prevBtn} onClick={handlePrev} disabled={currentQ === 0}>
                {t.detective.prevBtn}
              </button>
              <button className={styles.nextBtn} onClick={handleNext} disabled={selectedChoice === null}>
                {t.detective.nextBtn}
              </button>
            </div>
          </div>
        </div>
      )}

      {screen === "result" && result && (
        <div className={styles.resultScreen}>
          <div ref={resultRef} className="resultCard">
            <div className={styles.resultEmoji}>{result.emoji}</div>
            <div className={styles.resultType}>{result.type}</div>
            <h2 className={styles.resultTitle}>{result.title}</h2>
            <p className={styles.resultDesc}>{result.description}</p>
            <div className={styles.resultGrid}>
              <div className={styles.resultBox}>
                <h3>{t.detective.strengths}</h3>
                <ul>{result.strengths.map((s) => <li key={s}>{s}</li>)}</ul>
              </div>
              <div className={styles.resultBox}>
                <h3>{t.detective.weaknesses}</h3>
                <ul>{result.weaknesses.map((w) => <li key={w}>{w}</li>)}</ul>
              </div>
            </div>
          </div>
          <ShareResultButtons
            resultRef={resultRef}
            title={t.detective.shareTitle.replace('{type}', result.type).replace('{title}', result.title)}
            description={result.description}
          />
          <button className={styles.restartBtn} onClick={restart}>{t.common.retry}</button>
          <button className={styles.mainBtn} onClick={() => router.push("/main")}>{t.common.backToMain}</button>
        </div>
      )}
    </div>
  );
}
