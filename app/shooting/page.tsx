"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { recordSuccess } from "@/lib/levelSystem";
import styles from "./shooting.module.css";

type Screen = "start" | "game" | "result";
type Difficulty = "easy" | "normal" | "hard" | "challenge";

interface Target {
  id: number;
  x: number;
  sway: number;
  duration: number;
  size: number;
}

const SETTINGS = {
  easy: { size: 100 },
  normal: { size: 80 },
  hard: { size: 60 },
  challenge: { size: 40 },
};

export default function ShootingTest() {
  const router = useRouter();
  const { user } = useAuth()
  const [screen, setScreen] = useState<Screen>("start");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [targets, setTargets] = useState<Target[]>([]);

  const targetIdCounter = useRef(0);
  const spawnTimerRef = useRef<number | null>(null);
  const isGameOver = useRef(false);
  const scoreRef = useRef(0);

  const scheduleNextSpawn = useCallback(() => {
    if (isGameOver.current) return;

    const currentScore = scoreRef.current;
    const currentSpawnRate = Math.max(400, 1200 - currentScore * 15);
    const currentDuration = Math.max(1500, 4000 - currentScore * 40);

    const newTarget: Target = {
      id: targetIdCounter.current++,
      x: Math.floor(Math.random() * 80) + 10,
      sway: Math.floor(Math.random() * 30) - 15,
      duration: currentDuration,
      size: SETTINGS[difficulty].size,
    };

    setTargets((prev) => [...prev, newTarget]);
    spawnTimerRef.current = window.setTimeout(scheduleNextSpawn, currentSpawnRate);
  }, [difficulty]);

  const startGame = (selectedDifficulty: Difficulty) => {
    setDifficulty(selectedDifficulty);
    setScore(0);
    scoreRef.current = 0;
    setLives(3);
    setTargets([]);
    setScreen("game");
    isGameOver.current = false;
    targetIdCounter.current = 0;
  };

  useEffect(() => {
    if (screen === "game" && !isGameOver.current) {
      scheduleNextSpawn();
      return () => {
        if (spawnTimerRef.current) window.clearTimeout(spawnTimerRef.current);
      };
    }
  }, [screen, scheduleNextSpawn]);

  const handleGameOver = useCallback(() => {
    isGameOver.current = true;
    if (spawnTimerRef.current) window.clearTimeout(spawnTimerRef.current);
    setScreen("result");
    setTargets([]);
    if (user) recordSuccess(user.id, 'shooting')
  }, [user]);

  const handleHit = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGameOver.current) return;

    setTargets((prev) => prev.filter((t) => t.id !== id));
    setScore((prev) => {
      const newScore = prev + 1;
      scoreRef.current = newScore;
      return newScore;
    });
  };

  const handleMiss = (id: number) => {
    if (isGameOver.current) return;

    setTargets((prev) => prev.filter((t) => t.id !== id));
    setLives((prev) => {
      const nextLives = prev - 1;
      if (nextLives <= 0) {
        handleGameOver();
      }
      return nextLives;
    });
  };

  const resetGame = () => {
    setScreen("start");
    setTargets([]);
  };

  const getRank = (finalScore: number, diff: Difficulty) => {
    const multiplier = diff === "challenge" ? 2 : diff === "hard" ? 1.5 : diff === "normal" ? 1 : 0.8;
    const adjustedScore = finalScore * multiplier;

    if (adjustedScore >= 100) return "신급 에임 마스터 (상위 0.1%)";
    if (adjustedScore >= 60) return "특수부대 정예 스나이퍼 (상위 5%)";
    if (adjustedScore >= 30) return "사격장 고인물 (상위 20%)";
    if (adjustedScore >= 15) return "입문용 사수 (일반인 평균)";
    return "총기 난사범 (침착하게 쏘세요!)";
  };

  return (
    <div className={styles.container}>
      {screen === "start" && (
        <div className={styles.startScreen}>
          <div className={styles.startEmoji}>🔫</div>
          <h1 className={styles.startTitle}>무빙 에임 사격 테스트</h1>
          <p className={styles.startDesc}>
            떨어지는 표적을 쏴서 맞추세요!<br />
            진행될수록 떨어지는 속도가 점점 빨라집니다.
          </p>
          <h2 className={styles.diffTitle}>난이도를 선택하세요 (표적 크기)</h2>
          <div className={styles.difficultyContainer}>
            <button className={styles.btn} onClick={() => startGame("easy")}>쉬움</button>
            <button className={styles.btn} onClick={() => startGame("normal")}>보통</button>
            <button className={styles.btn} onClick={() => startGame("hard")}>어려움</button>
            <button className={`${styles.btn} ${styles.challengeBtn}`} onClick={() => startGame("challenge")}>
              챌린지
            </button>
          </div>
        </div>
      )}

      {screen === "game" && (
        <div className={styles.gameScreen}>
          <div className={styles.hud}>
            <button className={styles.backBtn} onClick={() => { isGameOver.current = true; resetGame(); }}>
              ← 포기
            </button>
            <div className={styles.scoreBox}>점수: {score}</div>
            <div className={styles.livesBox}>
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className={i < lives ? styles.heartAlive : styles.heartDead}>
                  ❤️
                </span>
              ))}
            </div>
          </div>

          <div className={styles.playArea}>
            {targets.map((target) => (
              <div
                key={target.id}
                className={styles.targetObj}
                style={
                  {
                    left: `${target.x}%`,
                    width: `${target.size}px`,
                    height: `${target.size}px`,
                    animationDuration: `${target.duration}ms`,
                    "--sway": `${target.sway}vw`,
                  } as React.CSSProperties
                }
                onAnimationEnd={() => handleMiss(target.id)}
                onMouseDown={(e) => handleHit(target.id, e)}
              />
            ))}
          </div>
        </div>
      )}

      {screen === "result" && (
        <div className={styles.resultScreen}>
          <div className={styles.resultEmoji}>💥</div>
          <h2 className={styles.resultTitle}>GAME OVER</h2>

          <div className={styles.scoreBoard}>
            <h3>최종 명중 횟수</h3>
            <div className={styles.finalScore}>{score} 타겟</div>
            <div className={styles.rankBadge}>{getRank(score, difficulty)}</div>
            <p style={{ marginTop: "12px", color: "#86868b", fontSize: "14px" }}>
              플레이 난이도: {difficulty.toUpperCase()}
            </p>
          </div>

          <button className={styles.restartBtn} onClick={resetGame}>다시 도전하기</button>
          <button className={styles.mainBtn} onClick={() => router.push("/main")}>메인으로 돌아가기</button>
        </div>
      )}
    </div>
  );
}
