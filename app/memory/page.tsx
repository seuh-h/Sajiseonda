"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { recordSuccess } from "@/lib/levelSystem";
import styles from "./memory.module.css";
import ShareResultButtons from "@/components/ShareResultButtons";

type Screen = "start" | "countdown" | "game";

const COLORS = [
  "#ff3b30", "#330be2", "#01ff95", "#ddec00", "#5856d6",
  "#ff9500", "#af52de", "#5ac8fa", "#ff2d55", "#a2845e",
  "#1abc9c", "#2ecc71", "#3498db", "#9b59b6", "#f1c40f",
  "#e67e22", "#e74c3c", "#34495e", "#7f8c8d", "#d35400",
  "#c0392b", "#16a085", "#27ae60", "#2980b9", "#8e44ad",
];

const TILE_SIZES: Record<number, number> = { 2: 140, 3: 140, 4: 120, 5: 100 };

const sleep = (ms: number) => new Promise<void>((r) => setTimeout(r, ms));

export default function MemoryTest() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [screen, setScreen] = useState<Screen>("start");
  const [countdownText, setCountdownText] = useState("3");
  const [statusText, setStatusText] = useState("");
  const [isGameOver, setIsGameOver] = useState(false);
  const [finalLevel, setFinalLevel] = useState(0);
  const [gridSize, setGridSize] = useState(2);
  const [activeTiles, setActiveTiles] = useState<Set<number>>(new Set());

  const resultRef = useRef<HTMLDivElement>(null);
  const gameSequence = useRef<number[]>([]);
  const levelRef = useRef(0);
  const isWaiting = useRef(false);
  const userSequence = useRef<number[]>([]);
  const gridSizeRef = useRef(2);

  const flashTile = useCallback((index: number, duration: number): Promise<void> => {
    return new Promise((resolve) => {
      setActiveTiles((prev) => new Set(prev).add(index));
      setTimeout(() => {
        setActiveTiles((prev) => {
          const next = new Set(prev);
          next.delete(index);
          return next;
        });
        resolve();
      }, duration);
    });
  }, []);

  const playSequence = useCallback(
    async (sequence: number[], level: number) => {
      const speed = Math.max(200, 600 - level * 30);
      for (const idx of sequence) {
        await flashTile(idx, speed);
        await sleep(speed / 2);
      }
    },
    [flashTile]
  );

  const handleGameOver = useCallback(() => {
    setStatusText(t.memory.wrong);
    setFinalLevel(levelRef.current);
    setIsGameOver(true);
    isWaiting.current = false;
    if (user) recordSuccess(user.id, 'memory');
  }, [user, t]);

  const nextLevel = useCallback(async () => {
    levelRef.current++;
    userSequence.current = [];
    isWaiting.current = false;
    setStatusText(t.memory.remember.replace('{level}', String(levelRef.current)));

    const randomIndex = Math.floor(Math.random() * (gridSizeRef.current * gridSizeRef.current));
    gameSequence.current.push(randomIndex);

    await sleep(800);
    await playSequence(gameSequence.current, levelRef.current);

    isWaiting.current = true;
    setStatusText(t.memory.yourTurn.replace('{total}', String(gameSequence.current.length)));
  }, [playSequence, t]);

  const onTileClick = useCallback(
    (index: number) => {
      if (!isWaiting.current) return;

      userSequence.current.push(index);

      setActiveTiles((prev) => new Set(prev).add(index));
      setTimeout(() => {
        setActiveTiles((prev) => {
          const next = new Set(prev);
          next.delete(index);
          return next;
        });
      }, 200);

      const step = userSequence.current.length - 1;
      if (userSequence.current[step] !== gameSequence.current[step]) {
        handleGameOver();
        return;
      }

      const progress = userSequence.current.length;
      const total = gameSequence.current.length;
      setStatusText(t.memory.progress.replace('{done}', String(progress)).replace('{total}', String(total)));

      if (progress === total) {
        isWaiting.current = false;
        setTimeout(() => nextLevel(), 1000);
      }
    },
    [handleGameOver, nextLevel, t]
  );

  const startGame = useCallback(
    (size: number) => {
      gridSizeRef.current = size;
      setGridSize(size);
      gameSequence.current = [];
      levelRef.current = 0;
      userSequence.current = [];
      setIsGameOver(false);
      setActiveTiles(new Set());
      setScreen("countdown");

      let count = 3;
      setCountdownText("3");

      const timer = setInterval(() => {
        count--;
        if (count > 0) {
          setCountdownText(String(count));
        } else if (count === 0) {
          setCountdownText("START!");
        } else {
          clearInterval(timer);
          setScreen("game");
          setStatusText(t.memory.ready);
          nextLevel();
        }
      }, 1000);
    },
    [nextLevel, t]
  );

  const resetGame = useCallback(() => {
    gameSequence.current = [];
    userSequence.current = [];
    levelRef.current = 0;
    isWaiting.current = false;
    setActiveTiles(new Set());
    setScreen("start");
    setIsGameOver(false);
  }, []);

  const tileSize = TILE_SIZES[gridSize] ?? 140;

  return (
    <div className={styles.body}>
      {screen === "start" && (
        <div className={styles.startScreen}>
          <Image src="/img/memory.png" alt={t.memory.ready} width={450} height={450} className={styles.startImage} />
          <h2 className={styles.startTitle}>{t.common.difficulty}</h2>
          <div className={styles.difficultyContainer}>
            <button className={styles.btn} onClick={() => startGame(2)}>{t.common.easy}</button>
            <button className={styles.btn} onClick={() => startGame(3)}>{t.common.normal}</button>
            <button className={styles.btn} onClick={() => startGame(4)}>{t.common.hard}</button>
            <button className={styles.btn} onClick={() => startGame(5)}>{t.common.challenge}</button>
          </div>
        </div>
      )}

      {screen === "countdown" && (
        <div className={styles.countdownOverlay}>{countdownText}</div>
      )}

      {screen === "game" && (
        <div className={styles.gameScreen}>
          <div className={styles.statusText}>{statusText}</div>
          <div
            className={styles.gridContainer}
            style={{ gridTemplateColumns: `repeat(${gridSize}, 1fr)` }}
          >
            {Array.from({ length: gridSize * gridSize }, (_, i) => (
              <div
                key={i}
                className={`${styles.tile} ${activeTiles.has(i) ? styles.tileActive : ""}`}
                style={{ backgroundColor: COLORS[i], width: tileSize, height: tileSize }}
                onClick={() => onTileClick(i)}
              />
            ))}
          </div>

          {isGameOver && (
            <div className={styles.gameOver}>
              <div ref={resultRef} className="resultCard">
                <h3 className={styles.gameOverTitle}>{t.common.gameOver}</h3>
                <p className={styles.finalScore}>
                  {t.memory.reachedLevel.replace('{level}', String(finalLevel))}
                </p>
              </div>
              <ShareResultButtons
                resultRef={resultRef}
                title={t.memory.shareTitle.replace('{level}', String(finalLevel))}
                description={t.memory.shareDesc}
              />
              <button className={styles.btn} onClick={resetGame}>
                {t.memory.backToMain}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
