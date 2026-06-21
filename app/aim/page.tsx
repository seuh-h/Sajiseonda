"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { recordSuccess } from "@/lib/levelSystem";
import styles from "./aim.module.css";
import ShareResultButtons from "@/components/ShareResultButtons";

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
  const { user } = useAuth();
  const { t } = useTranslation();
  const [screen, setScreen] = useState<Screen>("start");
  const [numbers, setNumbers] = useState<number[]>([]);
  const [currentTarget, setCurrentTarget] = useState(1);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [finalTime, setFinalTime] = useState(0);

  const timerRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const resultRef = useRef<HTMLDivElement>(null);

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
        const totalTime = Date.now() - startTimeRef.current;
        if (timerRef.current) cancelAnimationFrame(timerRef.current);
        setFinalTime(totalTime);
        setScreen("result");
        if (user) recordSuccess(user.id, 'aim');
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

  const formatTime = (ms: number) => (ms / 1000).toFixed(2);

  const getRank = (ms: number) => {
    if (ms < 10000) return { rank: "S", title: t.aim.ranks.s };
    if (ms < 15000) return { rank: "A", title: t.aim.ranks.a };
    if (ms < 20000) return { rank: "B", title: t.aim.ranks.b };
    return { rank: "C", title: t.aim.ranks.c };
  };

  const rankInfo = getRank(finalTime);

  return (
    <div className={styles.container}>
      {screen === "start" && (
        <div className={styles.startScreen}>
          <div className={styles.startEmoji}>🎯</div>
          <h1 className={styles.startTitle}>{t.aim.title}</h1>
          <p className={styles.startDesc}>{t.aim.desc}</p>
          <button className={styles.startBtn} onClick={startGame}>{t.aim.startBtn}</button>
        </div>
      )}

      {screen === "game" && (
        <div className={styles.gameScreen}>
          <button className={styles.backToMainLink} onClick={() => router.push("/main")}>
            {t.aim.quit}
          </button>
          <div className={styles.header}>
            <div className={styles.targetInfo}>
              {t.aim.nextNumber.replace('{n}', String(currentTarget))}
            </div>
            <div className={styles.timerBox}>
              {t.aim.seconds.replace('{t}', formatTime(elapsedTime))}
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
          <div ref={resultRef} className="resultCard">
            <div className={styles.resultEmoji}>🏆</div>
            <div className={styles.resultRank}>{rankInfo.rank} Class</div>
            <h2 className={styles.resultTitle}>{rankInfo.title}</h2>
            <div className={styles.scoreBoard}>
              <h3>{t.aim.finalRecord}</h3>
              <div className={styles.finalTime}>
                {t.aim.seconds.replace('{t}', formatTime(finalTime))}
              </div>
            </div>
          </div>
          <ShareResultButtons
            resultRef={resultRef}
            title={t.aim.shareTitle.replace('{rank}', rankInfo.rank)}
            description={t.aim.shareDesc.replace('{title}', rankInfo.title).replace('{time}', formatTime(finalTime))}
          />
          <button className={styles.restartBtn} onClick={resetGame}>{t.common.retry}</button>
          <button className={styles.mainBtn} onClick={() => router.push("/main")}>{t.common.backToMain}</button>
        </div>
      )}
    </div>
  );
}
