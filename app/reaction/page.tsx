"use client";

import { useState, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { recordSuccess } from "@/lib/levelSystem";
import styles from "./reaction.module.css";
import ShareResultButtons from "@/components/ShareResultButtons";

type GameState = "start" | "waiting" | "ready" | "early" | "result" | "finish";

export default function ReactionTest() {
  const router = useRouter();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [gameState, setGameState] = useState<GameState>("start");
  const [results, setResults] = useState<number[]>([]);
  const [message, setMessage] = useState("");
  const [subMessage, setSubMessage] = useState("");

  const startTime = useRef<number>(0);
  const timeoutId = useRef<NodeJS.Timeout | null>(null);
  const resultRef = useRef<HTMLDivElement>(null);

  const startRound = useCallback(() => {
    setGameState("waiting");
    setMessage(t.reaction.waiting);
    setSubMessage(t.reaction.waitingSub);

    const randomDelay = Math.floor(Math.random() * 3000) + 2000;
    timeoutId.current = setTimeout(() => {
      setGameState("ready");
      setMessage(t.reaction.clickNow);
      setSubMessage("");
      startTime.current = Date.now();
    }, randomDelay);
  }, [t]);

  const handleClick = () => {
    if (gameState === "start" || gameState === "result") {
      startRound();
    } else if (gameState === "waiting") {
      if (timeoutId.current) clearTimeout(timeoutId.current);
      setGameState("early");
      setMessage(t.reaction.tooEarly);
      setSubMessage(t.reaction.tooEarlySub);
    } else if (gameState === "ready") {
      const reactionTime = Date.now() - startTime.current;
      const newResults = [...results, reactionTime];
      setResults(newResults);

      if (newResults.length >= 5) {
        setGameState("finish");
        if (user) recordSuccess(user.id, 'reaction');
      } else {
        setGameState("result");
        setMessage(`${reactionTime} ms`);
        setSubMessage(t.reaction.roundSub);
      }
    } else if (gameState === "early") {
      startRound();
    }
  };

  const resetGame = (e: React.MouseEvent) => {
    e.stopPropagation();
    setResults([]);
    setGameState("start");
    setMessage("");
    setSubMessage("");
  };

  const getAverage = () => {
    if (results.length === 0) return 0;
    return Math.round(results.reduce((a, b) => a + b, 0) / results.length);
  };

  const getRank = (ms: number) => {
    if (ms < 200) return t.reaction.ranks.pilot;
    if (ms < 250) return t.reaction.ranks.pro;
    if (ms < 300) return t.reaction.ranks.normal;
    return t.reaction.ranks.slow;
  };

  const displayMessage = gameState === "start"
    ? t.reaction.title
    : message;

  const displaySub = gameState === "start"
    ? t.reaction.subtitle
    : subMessage;

  return (
    <div
      className={`${styles.container} ${styles[gameState]}`}
      onClick={gameState !== "finish" ? handleClick : undefined}
    >
      {gameState !== "finish" && (
        <div className={styles.gameContent}>
          <button
            className={styles.backToMainLink}
            onClick={(e) => { e.stopPropagation(); router.push("/main"); }}
          >
            {t.common.backToMainMenu}
          </button>

          <h1 className={styles.mainText}>{displayMessage}</h1>
          <p className={styles.subText}>{displaySub}</p>

          {gameState !== "start" && (
            <div className={styles.progress}>
              {t.reaction.round.replace('{done}', String(results.length))}
            </div>
          )}
        </div>
      )}

      {gameState === "finish" && (
        <div className={styles.resultScreen}>
          <div ref={resultRef} className="resultCard">
            <div className={styles.resultEmoji}>⚡</div>
            <h2 className={styles.resultTitle}>{t.reaction.finishTitle}</h2>
            <div className={styles.scoreBoard}>
              <div className={styles.averageBox}>
                <h3>{t.reaction.avgSpeed}</h3>
                <div className={styles.averageScore}>{getAverage()} ms</div>
                <p className={styles.rankText}>{getRank(getAverage())}</p>
              </div>
              <ul className={styles.historyList}>
                {results.map((time, idx) => (
                  <li key={idx}>
                    <span>{idx + 1}{t.reaction.roundLabel}</span>
                    <span>{time} ms</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <ShareResultButtons
            resultRef={resultRef}
            title={t.reaction.shareTitle.replace('{ms}', String(getAverage()))}
            description={getRank(getAverage())}
          />
          <div className={styles.btnGroup}>
            <button className={styles.restartBtn} onClick={resetGame}>{t.common.retry}</button>
            <button className={styles.mainBtn} onClick={() => router.push("/main")}>{t.common.backToMain}</button>
          </div>
        </div>
      )}
    </div>
  );
}
