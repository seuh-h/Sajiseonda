"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { questions, MBTI_TYPES, RESULT_MESSAGES, calculateResult } from "./data";
import type { MBTIType } from "./data";
import styles from "./mbti-love.module.css";

const initAnswers = () => Array<number | null>(questions.length).fill(null);

export default function MBTILoveTest() {
  const router = useRouter();
  const [screen, setScreen] = useState<"start" | "mbti-input" | "test" | "result">("start");
  const [partnerMBTI, setPartnerMBTI] = useState<MBTIType | null>(null);
  const [currentQ, setCurrentQ] = useState(0);
  const [answers, setAnswers] = useState<(number | null)[]>(initAnswers());
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [resultData, setResultData] = useState<ReturnType<typeof calculateResult> | null>(null);

  const handleSelectMBTI = (mbti: MBTIType) => {
    setPartnerMBTI(mbti);
    setScreen("test");
  };

  const advance = (choice: number, currentAnswers: (number | null)[], qIndex: number) => {
    const newAnswers = [...currentAnswers];
    newAnswers[qIndex] = choice;
    setAnswers(newAnswers);

    if (qIndex + 1 >= questions.length) {
      const result = calculateResult(newAnswers as number[], partnerMBTI!);
      setResultData(result);
      setScreen("result");
    } else {
      setCurrentQ(qIndex + 1);
      setSelectedChoice(newAnswers[qIndex + 1] ?? null);
    }
  };

  const handleSelect = (choiceIndex: number) => {
    setSelectedChoice(choiceIndex);
    advance(choiceIndex, answers, currentQ);
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
    setPartnerMBTI(null);
    setResultData(null);
  };

  const handleShare = async (title: string) => {
    const url = window.location.origin + "/mbti-love";
    const text = `우리의 MBTI 궁합은 ${title}!\n사지선다에서 테스트해보세요`;
    if (navigator.share) {
      try { await navigator.share({ title: "MBTI 궁합 테스트", text, url }); } catch {}
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
  const resultMsg = resultData ? RESULT_MESSAGES[resultData.level] : null;

  return (
    <div className={styles.container}>
      {/* Start screen */}
      {screen === "start" && (
        <div className={styles.startScreen}>
          <div className={styles.startEmoji}>💑</div>
          <h1 className={styles.startTitle}>MBTI 궁합 테스트</h1>
          <p className={styles.startDesc}>
            연인의 MBTI와 나의 성향으로 알아보는<br />우리 사이의 궁합
          </p>
          <button className={styles.startBtn} onClick={() => setScreen("mbti-input")}>
            테스트 시작하기
          </button>
        </div>
      )}

      {/* MBTI Input screen */}
      {screen === "mbti-input" && (
        <div className={styles.mbtiInputScreen}>
          <button className={styles.backBtn} onClick={() => setScreen("start")}>← 뒤로</button>
          <h2 className={styles.mbtiInputTitle}>연인의 MBTI를 선택해주세요</h2>
          <p className={styles.mbtiInputDesc}>모르면 가장 비슷하다고 생각하는 유형을 골라보세요</p>
          <div className={styles.mbtiGrid}>
            {MBTI_TYPES.map((mbti) => (
              <button
                key={mbti}
                className={styles.mbtiBtn}
                onClick={() => handleSelectMBTI(mbti)}
              >
                {mbti}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Test screen */}
      {screen === "test" && (
        <div className={styles.testScreen}>
          <button className={styles.backBtn} onClick={() => router.push("/main")}>← 메인메뉴로</button>
          <div className={styles.partnerBadge}>연인: {partnerMBTI}</div>
          <div className={styles.progressBar}>
            <div className={styles.progressFill} style={{ width: `${progress}%` }} />
          </div>
          <p className={styles.progressText}>{currentQ + 1} / {questions.length}</p>
          <div className={styles.questionCard}>
            <div className={styles.questionBody}>
              <p className={styles.questionText}>{questions[currentQ].text}</p>
              <div className={styles.choiceList}>
                {questions[currentQ].choices.map((choice, i) => (
                  <button
                    key={i}
                    className={`${styles.choiceBtn} ${selectedChoice === i ? styles.choiceBtnSelected : ""}`}
                    onClick={() => handleSelect(i)}
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

      {/* Result screen */}
      {screen === "result" && resultData && resultMsg && (
        <div className={styles.resultScreen}>
          <div className={styles.resultEmoji}>{resultMsg.emoji}</div>
          <div className={`${styles.resultLevel} ${styles[`level_${resultData.level}`]}`}>
            {resultMsg.title}
          </div>
          <p className={styles.resultMessage}>{resultMsg.message}</p>

          <div className={styles.feedbackSection}>
            <h3 className={styles.feedbackTitle}>상세 피드백</h3>
            {resultData.feedbacks.map((fb) => (
              <div
                key={fb.dimension}
                className={`${styles.feedbackCard} ${fb.isGood ? styles.feedbackGood : styles.feedbackBad}`}
              >
                <div className={styles.feedbackHeader}>
                  <span className={styles.feedbackDim}>{fb.dimension}</span>
                  <span className={`${styles.feedbackIcon} ${fb.isGood ? styles.feedbackIconGood : styles.feedbackIconBad}`}>
                    {fb.isGood ? "✓" : "!"}
                  </span>
                </div>
                <p className={styles.feedbackText}>{fb.text}</p>
              </div>
            ))}
          </div>

          <button className={styles.shareBtn} onClick={() => handleShare(resultMsg.title)}>결과 공유하기</button>
          <button className={styles.restartBtn} onClick={restart}>다시 테스트하기</button>
          <button className={styles.mainBtn} onClick={() => router.push("/main")}>메인으로 돌아가기</button>
        </div>
      )}
    </div>
  );
}
