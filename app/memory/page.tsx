"use client";

import { useRef, useState, useCallback } from "react";
import Image from "next/image";
import { useAuth } from "@/hooks/useAuth";
import { recordSuccess } from "@/lib/levelSystem";
import styles from "./memory.module.css";

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
  const { user } = useAuth()
  const [screen, setScreen] = useState<Screen>("start");
  const [countdownText, setCountdownText] = useState("3");
  const [statusText, setStatusText] = useState("준비하세요!");
  const [isGameOver, setIsGameOver] = useState(false);
  const [finalLevel, setFinalLevel] = useState(0);
  const [gridSize, setGridSize] = useState(2);
  const [activeTiles, setActiveTiles] = useState<Set<number>>(new Set());

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
    setStatusText("틀렸습니다!");
    setFinalLevel(levelRef.current);
    setIsGameOver(true);
    isWaiting.current = false;
    if (user) recordSuccess(user.id, 'memory')
  }, [user]);

  const nextLevel = useCallback(async () => {
    levelRef.current++;
    userSequence.current = [];
    isWaiting.current = false;
    setStatusText(`레벨 ${levelRef.current}: 기억하세요!`);

    const randomIndex = Math.floor(Math.random() * (gridSizeRef.current * gridSizeRef.current));
    gameSequence.current.push(randomIndex);

    await sleep(800);
    await playSequence(gameSequence.current, levelRef.current);

    isWaiting.current = true;
    setStatusText(`당신의 차례! (0/${gameSequence.current.length})`);
  }, [playSequence]);

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
      setStatusText(`진행 중... (${progress}/${total})`);

      if (progress === total) {
        isWaiting.current = false;
        setTimeout(() => nextLevel(), 1000);
      }
    },
    [handleGameOver, nextLevel]
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
          setStatusText("준비하세요!");
          nextLevel();
        }
      }, 1000);
    },
    [nextLevel]
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
          <Image
            src="/img/memory.png"
            alt="Memory Logo"
            width={450}
            height={450}
            className={styles.startImage}
          />
          <h2 className={styles.startTitle}>난이도를 선택하세요</h2>
          <div className={styles.difficultyContainer}>
            <button className={styles.btn} onClick={() => startGame(2)}>쉬움</button>
            <button className={styles.btn} onClick={() => startGame(3)}>보통</button>
            <button className={styles.btn} onClick={() => startGame(4)}>어려움</button>
            <button className={styles.btn} onClick={() => startGame(5)}>챌린지</button>
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
                style={{
                  backgroundColor: COLORS[i],
                  width: tileSize,
                  height: tileSize,
                }}
                onClick={() => onTileClick(i)}
              />
            ))}
          </div>

          {isGameOver && (
            <div className={styles.gameOver}>
              <h3 className={styles.gameOverTitle}>GAME OVER</h3>
              <p className={styles.finalScore}>
                당신은 레벨 {finalLevel}까지 도달했습니다.
              </p>
              <button className={styles.btn} onClick={resetGame}>
                메인으로
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
