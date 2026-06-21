"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { recordSuccess } from "@/lib/levelSystem";
import styles from "./shooting.module.css";
import ShareResultButtons from "@/components/ShareResultButtons";

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
  const { user } = useAuth();
  const { t } = useTranslation();
  const [screen, setScreen] = useState<Screen>("start");
  const [difficulty, setDifficulty] = useState<Difficulty>("normal");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [targets, setTargets] = useState<Target[]>([]);

  const targetIdCounter = useRef(0);
  const spawnTimerRef = useRef<number | null>(null);
  const isGameOver = useRef(false);
  const scoreRef = useRef(0);
  const resultRef = useRef<HTMLDivElement>(null);

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
    if (user) recordSuccess(user.id, 'shooting');
  }, [user]);

  const handleHit = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    if (isGameOver.current) return;

    setTargets((prev) => prev.filter((target) => target.id !== id));
    setScore((prev) => {
      const newScore = prev + 1;
      scoreRef.current = newScore;
      return newScore;
    });
  };

  const handleMiss = (id: number) => {
    if (isGameOver.current) return;

    setTargets((prev) => prev.filter((target) => target.id !== id));
    setLives((prev) => {
      const nextLives = prev - 1;
      if (nextLives <= 0) handleGameOver();
      return nextLives;
    });
  };

  const resetGame = () => {
    setScreen("start");
    setTargets([]);
  };

  const getRank = (finalScore: number, diff: Difficulty) => {
    const multiplier = diff === "challenge" ? 2 : diff === "hard" ? 1.5 : diff === "normal" ? 1 : 0.8;
    const adjusted = finalScore * multiplier;
    if (adjusted >= 100) return t.shooting.ranks.god;
    if (adjusted >= 60)  return t.shooting.ranks.sniper;
    if (adjusted >= 30)  return t.shooting.ranks.veteran;
    if (adjusted >= 15)  return t.shooting.ranks.beginner;
    return t.shooting.ranks.random;
  };

  const diffLabel = (diff: Difficulty) => ({
    easy: t.common.easy, normal: t.common.normal,
    hard: t.common.hard, challenge: t.common.challenge,
  }[diff]);

  return (
    <div className={styles.container}>
      {screen === "start" && (
        <div className={styles.startScreen}>
          <div className={styles.startEmoji}>🔫</div>
          <h1 className={styles.startTitle}>{t.shooting.title}</h1>
          <p className={styles.startDesc}>
            {t.shooting.desc.split('\n').map((line, i) => (
              <span key={i}>{line}{i === 0 && <br />}</span>
            ))}
          </p>
          <h2 className={styles.diffTitle}>{t.shooting.diffTitle}</h2>
          <div className={styles.difficultyContainer}>
            <button className={styles.btn} onClick={() => startGame("easy")}>{t.common.easy}</button>
            <button className={styles.btn} onClick={() => startGame("normal")}>{t.common.normal}</button>
            <button className={styles.btn} onClick={() => startGame("hard")}>{t.common.hard}</button>
            <button className={`${styles.btn} ${styles.challengeBtn}`} onClick={() => startGame("challenge")}>
              {t.common.challenge}
            </button>
          </div>
        </div>
      )}

      {screen === "game" && (
        <div className={styles.gameScreen}>
          <div className={styles.hud}>
            <button className={styles.backBtn} onClick={() => { isGameOver.current = true; resetGame(); }}>
              {t.common.quit}
            </button>
            <div className={styles.scoreBox}>{t.shooting.scoreLabel.replace('{score}', String(score))}</div>
            <div className={styles.livesBox}>
              {Array.from({ length: 3 }).map((_, i) => (
                <span key={i} className={i < lives ? styles.heartAlive : styles.heartDead}>❤️</span>
              ))}
            </div>
          </div>

          <div className={styles.playArea}>
            {targets.map((target) => (
              <div
                key={target.id}
                className={styles.targetObj}
                style={{
                  left: `${target.x}%`,
                  width: `${target.size}px`,
                  height: `${target.size}px`,
                  animationDuration: `${target.duration}ms`,
                  "--sway": `${target.sway}vw`,
                } as React.CSSProperties}
                onAnimationEnd={() => handleMiss(target.id)}
                onMouseDown={(e) => handleHit(target.id, e)}
              />
            ))}
          </div>
        </div>
      )}

      {screen === "result" && (
        <div className={styles.resultScreen}>
          <div ref={resultRef} className="resultCard">
            <div className={styles.resultEmoji}>💥</div>
            <h2 className={styles.resultTitle}>{t.common.gameOver}</h2>
            <div className={styles.scoreBoard}>
              <h3>{t.shooting.finalScoreTitle}</h3>
              <div className={styles.finalScore}>{score} {t.shooting.finalScoreUnit}</div>
              <div className={styles.rankBadge}>{getRank(score, difficulty)}</div>
              <p style={{ marginTop: "12px", color: "#86868b", fontSize: "14px" }}>
                {t.shooting.diffLabel.replace('{diff}', diffLabel(difficulty).toUpperCase())}
              </p>
            </div>
          </div>
          <ShareResultButtons
            resultRef={resultRef}
            title={t.shooting.shareTitle.replace('{score}', String(score))}
            description={`${getRank(score, difficulty)} | ${t.shooting.diffLabel.replace('{diff}', diffLabel(difficulty).toUpperCase())}`}
          />
          <button className={styles.restartBtn} onClick={resetGame}>{t.common.retry}</button>
          <button className={styles.mainBtn} onClick={() => router.push("/main")}>{t.common.backToMain}</button>
        </div>
      )}
    </div>
  );
}
