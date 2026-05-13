"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { recordSuccess } from "@/lib/levelSystem";
import styles from "./aim.module.css";

type Screen = "start" | "game" | "result";

const TOTAL_NUMBERS = 20;

const shuffleArray = (array: number[]) => {
  const newArray = [...array];
  for (let i = newArray.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [newArray[i], newArray[j]] = [newArray[j], newArray[i]];
  }
  return newArray;
};

export default function AimTest() {
  const router = useRouter();
  const { user } = useAuth()
  const [screen, setScreen] = useState<Screen>("start");
  const [numbers, setNumbers] = useState<number[]>([]);
  const [currentTarget, setCurrentTarget] = useState(1);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [finalTime, setFinalTime] = useState(0);

  const timerRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);

  const updateTimer = useCallback(() => {
    if (startTimeRef.current) {
      setElapsedTime(Date.now() - startTimeRef.current);
      timerRef.current = requestAnimationFrame(updateTimer);
    }
  }, []);

  const startGame = () => {
    const initialNumbers = Array.from({ length: TOTAL_NUMBERS }, (_, i) => i + 1);
    setNumbers(shuffleArray(initialNumbers));
    setCurrentTarget(1);
    setElapsedTime(0);
    setScreen("game");

    startTimeRef.current = Date.now();
    timerRef.current = requestAnimationFrame(updateTimer);
  };

  const handleNumberClick = (num: number) => {
    if (num === currentTarget) {
      if (currentTarget === TOTAL_NUMBERS) {
        const endTime = Date.now();
        const totalTime = endTime - startTimeRef.current;
        if (timerRef.current) cancelAnimationFrame(timerRef.current);

        setFinalTime(totalTime);
        setScreen("result");
        if (user) recordSuccess(user.id, 'aim')
      } else {
        setCurrentTarget((prev) => prev + 1);
      }
    }
  };

  const resetGame = () => {
    if (timerRef.current) cancelAnimationFrame(timerRef.current);
    setScreen("start");
    setElapsedTime(0);
    setCurrentTarget(1);
  };

  useEffect(() => {
    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    };
  }, []);

  const formatTime = (ms: number) => {
    return (ms / 1000).toFixed(2);
  };

  const getRank = (ms: number) => {
    if (ms < 10000) return { rank: "S", title: "동체시력 마스터 (상위 1%)" };
    if (ms < 15000) return { rank: "A", title: "프로게이머 지망생 (상위 10%)" };
    if (ms < 20000) return { rank: "B", title: "일반인 평균" };
    return { rank: "C", title: "나무늘보 (조금 더 분발하세요!)" };
  };

  const rankInfo = getRank(finalTime);

  return (
    <div className={styles.container}>
      {screen === "start" && (
        <div className={styles.startScreen}>
          <div className={styles.startEmoji}>🎯</div>
          <h1 className={styles.startTitle}>에임 & 동체시력 테스트</h1>
          <p className={styles.startDesc}>1부터 20까지의 숫자를 순서대로 최대한 빨리 클릭하세요!</p>
          <button className={styles.startBtn} onClick={startGame}>
            게임 시작
          </button>
        </div>
      )}

      {screen === "game" && (
        <div className={styles.gameScreen}>
          <button className={styles.backToMainLink} onClick={() => router.push("/main")}>
            ← 포기하고 나가기
          </button>

          <div className={styles.header}>
            <div className={styles.targetInfo}>
              다음 숫자: <span>{currentTarget}</span>
            </div>
            <div className={styles.timerBox}>
              {formatTime(elapsedTime)} 초
            </div>
          </div>

          <div className={styles.grid}>
            {numbers.map((num) => (
              <button
                key={num}
                className={`${styles.numberBtn} ${num < currentTarget ? styles.hidden : ""}`}
                onClick={() => handleNumberClick(num)}
                disabled={num < currentTarget}
              >
                {num}
              </button>
            ))}
          </div>
        </div>
      )}

      {screen === "result" && (
        <div className={styles.resultScreen}>
          <div className={styles.resultEmoji}>🏆</div>
          <div className={styles.resultRank}>{rankInfo.rank} Class</div>
          <h2 className={styles.resultTitle}>{rankInfo.title}</h2>

          <div className={styles.scoreBoard}>
            <h3>최종 기록</h3>
            <div className={styles.finalTime}>{formatTime(finalTime)} 초</div>
          </div>

          <button className={styles.restartBtn} onClick={resetGame}>
            다시 도전하기
          </button>
          <button className={styles.mainBtn} onClick={() => router.push("/main")}>
            메인으로 돌아가기
          </button>
        </div>
      )}
    </div>
  );
}
