"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import styles from "./mystery.module.css";
import { CASES } from "./data";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase";

type Screen = "start" | "game" | "result";
type ActivePanel = "none" | "question" | "answer";

interface QAEntry {
  question: string;
  answer: string;
}

interface RankingEntry {
  user_id: string;
  nickname: string;
  time_seconds: number;
  rank: number;
}

const HINT_INTERVAL_SECONDS = 10 * 60;

function getAnswerStyle(answer: string) {
  if (answer.includes("그럴수도") || answer.includes("그럴 수도")) return styles.qaAnswerMaybe;
  if (answer.includes("중요하지")) return styles.qaAnswerIrrelevant;
  if (answer.includes("아니오") || answer.includes("아니요")) return styles.qaAnswerNo;
  if (answer.includes("네") || answer.includes("그렇습니다")) return styles.qaAnswerYes;
  return styles.qaAnswerIrrelevant;
}

export default function MysteryTest() {
  const router = useRouter();
  const { user, isAdmin, nickname } = useAuth();
  const currentCase = CASES[0];

  const [screen, setScreen] = useState<Screen>("start");
  const [elapsedSeconds, setElapsedSeconds] = useState(0);
  const [activePanel, setActivePanel] = useState<ActivePanel>("none");
  const [questionInput, setQuestionInput] = useState("");
  const [answerInput, setAnswerInput] = useState("");
  const [qaHistory, setQaHistory] = useState<QAEntry[]>([]);
  const [revealedHints, setRevealedHints] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState<{ type: "penalty" | "info"; msg: string } | null>(null);
  const [finalSeconds, setFinalSeconds] = useState(0);
  const [additionalFound, setAdditionalFound] = useState<string[]>([]);
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [rankingsLoading, setRankingsLoading] = useState(false);
  const [imageZoomed, setImageZoomed] = useState(false);
  const [isMuted, setIsMuted] = useState(false);

  const elapsedRef = useRef(0);
  const isRunningRef = useRef(false);
  const bgmRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    return () => { bgmRef.current?.pause(); };
  }, []);

  const playBgm = () => {
    if (!bgmRef.current) {
      bgmRef.current = new Audio("/audio/mystery-bgm.mp3");
      bgmRef.current.loop = true;
      bgmRef.current.volume = 0.4;
    }
    bgmRef.current.currentTime = 0;
    bgmRef.current.play();
  };
  const pauseBgm = () => { bgmRef.current?.pause(); };
  const toggleMute = () => {
    if (!bgmRef.current) return;
    bgmRef.current.muted = !bgmRef.current.muted;
    setIsMuted((prev) => !prev);
  };

  const addSeconds = (s: number) => {
    elapsedRef.current += s;
    setElapsedSeconds(elapsedRef.current);
  };

  const subtractSeconds = (s: number) => {
    elapsedRef.current = Math.max(0, elapsedRef.current - s);
    setElapsedSeconds(elapsedRef.current);
  };

  const stopTimer = useCallback(() => {
    isRunningRef.current = false;
  }, []);

  useEffect(() => {
    if (screen !== "game") return;
    isRunningRef.current = true;
    const interval = window.setInterval(() => {
      if (!isRunningRef.current) return;
      elapsedRef.current += 1;
      setElapsedSeconds(elapsedRef.current);
    }, 1000);
    return () => window.clearInterval(interval);
  }, [screen]);

  const fetchRankings = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("mystery_records")
      .select("user_id, nickname, time_seconds")
      .eq("case_id", currentCase.id)
      .order("time_seconds", { ascending: true });

    if (!data) return;

    const bestPerUser = new Map<string, { user_id: string; nickname: string; time_seconds: number }>();
    data.forEach((r) => {
      if (!bestPerUser.has(r.user_id) || r.time_seconds < bestPerUser.get(r.user_id)!.time_seconds) {
        bestPerUser.set(r.user_id, r);
      }
    });

    const ranked: RankingEntry[] = Array.from(bestPerUser.values())
      .sort((a, b) => a.time_seconds - b.time_seconds)
      .slice(0, 10)
      .map((r, i) => ({ ...r, rank: i + 1 }));

    setRankings(ranked);
    if (user) {
      const myIdx = ranked.findIndex((r) => r.user_id === user.id);
      setUserRank(myIdx >= 0 ? myIdx + 1 : null);
    }
  }, [currentCase.id, user]);

  const saveAndFetchRankings = async (timeSeconds: number) => {
    setRankingsLoading(true);
    try {
      const supabase = createClient();
      if (user) {
        await supabase.from("mystery_records").insert({
          user_id: user.id,
          case_id: currentCase.id,
          nickname: nickname || user.email?.split("@")[0] || "익명",
          time_seconds: timeSeconds,
        });
      }
      await fetchRankings();
    } finally {
      setRankingsLoading(false);
    }
  };

  const handleDeleteRanking = async (userId: string) => {
    const supabase = createClient();
    await supabase.from("mystery_records").delete().eq("user_id", userId).eq("case_id", currentCase.id);
    await fetchRankings();
  };

  const handleDeleteAllRankings = async () => {
    if (!window.confirm("모든 랭킹을 삭제하시겠습니까?")) return;
    const supabase = createClient();
    await supabase.from("mystery_records").delete().eq("case_id", currentCase.id);
    setRankings([]);
    setUserRank(null);
  };

  const startGame = () => {
    elapsedRef.current = 0;
    isRunningRef.current = false;
    setElapsedSeconds(0);
    setQaHistory([]);
    setRevealedHints(0);
    setActivePanel("none");
    setFeedback(null);
    setAdditionalFound([]);
    setImageZoomed(false);
    setScreen("game");
    playBgm();
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60).toString().padStart(2, "0");
    const sec = (s % 60).toString().padStart(2, "0");
    return `${m}:${sec}`;
  };

  const openPanel = (panel: ActivePanel) => {
    setActivePanel(panel);
    setQuestionInput("");
    setAnswerInput("");
    setFeedback(null);
  };

  const handleAskQuestion = async () => {
    if (!questionInput.trim() || isLoading) return;
    setIsLoading(true);
    addSeconds(60);
    try {
      const res = await fetch("/api/dealer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "question", question: questionInput, solution: currentCase.solution }),
      });
      const data = await res.json();
      setQaHistory((prev) => [...prev, { question: questionInput, answer: data.result || "오류가 발생했습니다." }]);
      setQuestionInput("");
    } catch {
      setFeedback({ type: "penalty", msg: "오류가 발생했습니다. 다시 시도해주세요." });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmitAnswer = async () => {
    if (!answerInput.trim() || isLoading) return;
    setIsLoading(true);
    try {
      const res = await fetch("/api/dealer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: "answer",
          answer: answerInput,
          solution: currentCase.solution,
          mainKeywords: currentCase.mainKeywords,
          keywordDescriptions: currentCase.keywordDescriptions,
          additionalKeywords: currentCase.additionalKeywords,
        }),
      });
      const data = await res.json();

      let result: { keywords: { name: string; found: boolean; wrongContext: boolean }[] };
      try {
        result = JSON.parse(data.result.replace(/```json|```/g, "").trim());
      } catch {
        setFeedback({ type: "penalty", msg: "판정 오류가 발생했습니다. 다시 시도해주세요." });
        setIsLoading(false);
        return;
      }

      const keywords = result.keywords ?? [];
      const isCorrect = keywords.length > 0 && keywords.every((k) => k.found && !k.wrongContext);
      const missingCount = keywords.filter((k) => !k.found).length;
      const hasWrongContext = keywords.some((k) => k.wrongContext);

      // check additional keywords with string matching
      const lowerAnswer = answerInput.toLowerCase();
      const foundAdditional = currentCase.additionalKeywords.filter((kw) =>
        (currentCase.additionalKeywordSynonyms[kw] ?? [kw]).some((syn) =>
          lowerAnswer.includes(syn.toLowerCase())
        )
      );

      if (isCorrect) {
        stopTimer();
        pauseBgm();
        const bonus = foundAdditional.length;
        if (bonus > 0) subtractSeconds(bonus * 60);
        const finalTime = elapsedRef.current;
        setAdditionalFound(foundAdditional);
        setFinalSeconds(finalTime);
        setScreen("result");
        await saveAndFetchRankings(finalTime);
      } else {
        addSeconds(300);
        let msg = "";
        if (hasWrongContext) {
          msg = "오답입니다! 키워드의 주체나 맥락이 틀렸습니다. +5분이 추가되었습니다.";
        } else if (missingCount > 0) {
          msg = `키워드가 ${missingCount}개 부족합니다. +5분이 추가되었습니다.`;
        } else {
          msg = "오답입니다! +5분이 추가되었습니다.";
        }
        setFeedback({ type: "penalty", msg });
        setAnswerInput("");
      }
    } catch {
      setFeedback({ type: "penalty", msg: "오류가 발생했습니다. 다시 시도해주세요." });
    } finally {
      setIsLoading(false);
    }
  };

  // hints unlock one every 10 minutes
  const availableHints = Math.min(Math.floor(elapsedSeconds / HINT_INTERVAL_SECONDS), currentCase.hints.length);
  const nextHintIn = HINT_INTERVAL_SECONDS - (elapsedSeconds % HINT_INTERVAL_SECONDS);

  return (
    <div className={styles.container}>
      {/* ── Start Screen ── */}
      {screen === "start" && (
        <div className={styles.startScreen}>
          <button className={styles.startBackBtn} onClick={() => router.push("/main")}>
            ← 메인으로
          </button>
          <div className={styles.startEmoji}>🔍</div>
          <h1 className={styles.startTitle}>수평사고 퀴즈</h1>
          <p className={styles.startDesc}>
            이번 게임은 추리력과 판단력을 이용하여 주어진 사건의 인과관계를 추리해야 하는 게임이다.<br />
            가장 적은 시간을 소모하여 추리하는 데 성공하세요.
          </p>

          <div className={styles.rulesBox}>
            <h3>게임 규칙</h3>
            <div className={styles.ruleItem}>
              <span className={styles.ruleIcon}>⏱️</span>
              <span>사건이 공개되는 순간 타이머가 시작됩니다.</span>
            </div>
            <div className={styles.ruleItem}>
              <span className={styles.ruleIcon}>❓</span>
              <span>질문하기: 질문 1개당 <b>+1분</b> 추가. 횟수 제한 없음.</span>
            </div>
            <div className={styles.ruleItem}>
              <span className={styles.ruleIcon}>💬</span>
              <span>딜러는 <b>네 / 아니오 / 그럴수도 / 중요하지않음</b> 중 하나로만 답합니다.</span>
            </div>
            <div className={styles.ruleItem}>
              <span className={styles.ruleIcon}>✅</span>
              <span>정답: 오답 시 <b>+5분</b>. 추가 키워드 포함 시 키워드당 <b>-1분</b>.</span>
            </div>
            <div className={styles.ruleItem}>
              <span className={styles.ruleIcon}>💡</span>
              <span>10분마다 힌트 1개씩 공개됩니다.</span>
            </div>
          </div>

          <button className={styles.startBtn} onClick={startGame}>
            수사 시작
          </button>
        </div>
      )}

      {/* ── Game Screen ── */}
      {screen === "game" && (
        <div className={styles.gameScreen}>
          <div className={styles.timerBar}>
            <button className={styles.backBtn} onClick={() => { stopTimer(); pauseBgm(); setScreen("start"); }}>
              ← 포기
            </button>
            <div>
              <div className={styles.timerLabel}>경과 시간</div>
              <div className={styles.timerValue}>{formatTime(elapsedSeconds)}</div>
            </div>
            <button className={styles.muteBtn} onClick={toggleMute} title={isMuted ? "음소거 해제" : "음소거"}>
              {isMuted ? "🔇" : "🔊"}
            </button>
          </div>

          <div className={styles.gameBody}>
            <div className={styles.casePanel}>
              <div
                className={styles.caseImageWrap}
                onClick={() => setImageZoomed(true)}
                title="클릭하여 확대"
              >
                <Image src={currentCase.image} alt="사건 이미지" fill style={{ objectFit: "cover" }} />
                <div className={styles.imageZoomHint}>🔍 클릭하여 확대</div>
              </div>
              <div className={styles.situationBox}>
                <div className={styles.situationLabel}>CASE {currentCase.id}</div>
                <p className={styles.situationText}>{currentCase.situation}</p>
              </div>
            </div>

            <div className={styles.controlsPanel}>
              <div className={styles.actionBtns}>
                <button
                  className={`${styles.actionBtn} ${styles.questionBtn}`}
                  onClick={() => openPanel(activePanel === "question" ? "none" : "question")}
                >
                  ❓ 질문하기
                </button>
                <button
                  className={`${styles.actionBtn} ${styles.answerBtn}`}
                  onClick={() => openPanel(activePanel === "answer" ? "none" : "answer")}
                >
                  ✅ 정답 말하기
                </button>
              </div>

              <div className={styles.keywordInfo}>
                <div className={styles.keywordInfoTitle}>📋 정답 조건</div>
                <div className={styles.keywordInfoRow}>
                  <span className={styles.keywordInfoBadgeMain}>메인 키워드 {currentCase.mainKeywords.length}개</span>
                  <span className={styles.keywordInfoDesc}>정답에 모두 포함되어야 합니다</span>
                </div>
                <div className={styles.keywordInfoRow}>
                  <span className={styles.keywordInfoBadgeBonus}>추가 키워드 {currentCase.additionalKeywords.length}개</span>
                  <span className={styles.keywordInfoDesc}>정답 유무와 무관 · 포함 시 키워드당 <b>-1분</b> 보너스</span>
                </div>
              </div>

              {activePanel === "question" && (
                <div className={styles.inputPanel}>
                  <div className={styles.inputPanelHeader}>
                    <span className={styles.inputPanelTitle}>질문하기</span>
                    <span className={styles.sessionBadge}>총 {qaHistory.length}개 질문</span>
                  </div>
                  <textarea
                    className={styles.inputField}
                    placeholder="예: 바이올렛은 자연사했나요?"
                    value={questionInput}
                    onChange={(e) => setQuestionInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleAskQuestion(); } }}
                    disabled={isLoading}
                  />
                  <div className={styles.inputFooter}>
                    <span className={styles.inputHint}>질문 1개당 +1분 추가됩니다</span>
                    <button className={styles.submitBtn} onClick={handleAskQuestion} disabled={!questionInput.trim() || isLoading}>
                      {isLoading ? "판단 중..." : "질문 전송"}
                    </button>
                  </div>
                  {feedback && (
                    <div className={`${styles.feedback} ${feedback.type === "penalty" ? styles.feedbackPenalty : styles.feedbackInfo}`}>
                      {feedback.msg}
                    </div>
                  )}
                </div>
              )}

              {activePanel === "answer" && (
                <div className={styles.inputPanel}>
                  <div className={styles.inputPanelHeader}>
                    <span className={styles.inputPanelTitle}>정답 말하기</span>
                  </div>
                  <textarea
                    className={styles.inputField}
                    placeholder="사건의 전말을 최대한 자세히 서술하세요..."
                    value={answerInput}
                    onChange={(e) => setAnswerInput(e.target.value)}
                    style={{ minHeight: 120 }}
                    disabled={isLoading}
                  />
                  <div className={styles.inputFooter}>
                    <span className={styles.inputHint}>오답 시 +5분 | 추가 키워드 포함 시 -1분</span>
                    <button className={styles.submitBtn} onClick={handleSubmitAnswer} disabled={!answerInput.trim() || isLoading}>
                      {isLoading ? "판정 중..." : "정답 제출"}
                    </button>
                  </div>
                  {feedback && (
                    <div className={`${styles.feedback} ${feedback.type === "penalty" ? styles.feedbackPenalty : styles.feedbackInfo}`}>
                      {feedback.msg}
                    </div>
                  )}
                </div>
              )}

              <div className={styles.qaHistory}>
                <div className={styles.qaHistoryTitle}>Q&A 기록</div>
                {qaHistory.length === 0 ? (
                  <div className={styles.qaEmpty}>질문 기록이 없습니다</div>
                ) : (
                  [...qaHistory].reverse().map((entry, i) => (
                    <div key={i} className={styles.qaItem}>
                      <div className={styles.qaQuestion}>Q. {entry.question}</div>
                      <div className={`${styles.qaAnswer} ${getAnswerStyle(entry.answer)}`}>→ {entry.answer}</div>
                    </div>
                  ))
                )}
              </div>

              <div className={styles.hintSection}>
                <div className={styles.hintHeader}>
                  <span className={styles.hintTitle}>💡 힌트</span>
                  <span className={styles.hintCount}>{revealedHints}/{currentCase.hints.length}</span>
                </div>
                {availableHints === 0 ? (
                  <div className={styles.hintLocked}>
                    🔒 첫 번째 힌트까지<br />
                    <span style={{ fontSize: 12, marginTop: 4, display: "block" }}>
                      {formatTime(nextHintIn)} 남음
                    </span>
                  </div>
                ) : (
                  <div className={styles.hintList}>
                    {currentCase.hints.slice(0, revealedHints).map((hint, i) => (
                      <div key={i} className={styles.hintItem}>
                        <span className={styles.hintItemNum}>힌트 {i + 1}.</span>{hint}
                      </div>
                    ))}
                    {revealedHints < availableHints && (
                      <button className={styles.revealHintBtn} onClick={() => setRevealedHints((p) => p + 1)}>
                        + 힌트 {revealedHints + 1} 공개
                        {availableHints - revealedHints > 1 && ` (${availableHints - revealedHints}개 열람 가능)`}
                      </button>
                    )}
                    {revealedHints >= availableHints && availableHints < currentCase.hints.length && (
                      <div className={styles.hintLocked} style={{ marginTop: 8 }}>
                        다음 힌트까지 {formatTime(nextHintIn)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Image zoom overlay */}
          {imageZoomed && (
            <div className={styles.imageOverlay} onClick={() => setImageZoomed(false)}>
              <img src={currentCase.image} alt="사건 이미지 확대" className={styles.imageZoomed} />
              <div className={styles.imageOverlayHint}>클릭하여 닫기</div>
            </div>
          )}
        </div>
      )}

      {/* ── Result Screen ── */}
      {screen === "result" && (
        <div className={styles.resultScreen}>
          <div className={styles.resultEmoji}>🎉</div>
          <h2 className={styles.resultTitle}>정답입니다!</h2>
          <p className={styles.resultSubtitle}>사건의 전말을 밝혀냈습니다</p>

          <div className={styles.resultCard}>
            <h3>최종 기록</h3>
            <div className={styles.finalTime}>{formatTime(finalSeconds)}</div>
            {additionalFound.length > 0 && (
              <div className={styles.bonusBadge}>
                🎯 추가 키워드 {additionalFound.length}개 적중! (-{additionalFound.length}분)
              </div>
            )}
            <div className={styles.additionalKeywordsBox}>
              <div className={styles.additionalKeywordsLabel}>추가 키워드</div>
              <div className={styles.additionalKeywordsList}>
                {currentCase.additionalKeywords.map((kw) => (
                  <span
                    key={kw}
                    className={`${styles.additionalKeywordChip} ${additionalFound.includes(kw) ? styles.additionalKeywordHit : ""}`}
                  >
                    {additionalFound.includes(kw) ? "✓ " : ""}{kw}
                  </span>
                ))}
              </div>
            </div>
            {userRank && (
              <div className={styles.myRankBadge}>🏅 내 순위: {userRank}위</div>
            )}
            {!user && (
              <p style={{ fontSize: 13, color: "rgba(255,255,255,0.4)", marginTop: 12 }}>
                로그인하면 랭킹에 기록됩니다
              </p>
            )}
            <div className={styles.solutionBox}>
              <h4>사건의 전말</h4>
              <p className={styles.solutionText}>{currentCase.solution}</p>
            </div>
          </div>

          {/* Ranking */}
          <div className={styles.rankingSection}>
            <div className={styles.rankingHeader}>
              <span className={styles.rankingTitle}>🏆 랭킹</span>
              {isAdmin && rankings.length > 0 && (
                <button className={styles.deleteAllBtn} onClick={handleDeleteAllRankings}>
                  전체 삭제
                </button>
              )}
            </div>
            {rankingsLoading ? (
              <div className={styles.rankingEmpty}>불러오는 중...</div>
            ) : rankings.length === 0 ? (
              <div className={styles.rankingEmpty}>아직 기록이 없습니다</div>
            ) : (
              rankings.map((entry) => (
                <div
                  key={entry.user_id}
                  className={`${styles.rankingRow} ${user && entry.user_id === user.id ? styles.rankingRowMe : ""}`}
                >
                  <div className={`${styles.rankNum} ${entry.rank === 1 ? styles.rankNum1 : entry.rank === 2 ? styles.rankNum2 : entry.rank === 3 ? styles.rankNum3 : ""}`}>
                    {entry.rank}
                  </div>
                  <div className={styles.rankNickname}>{entry.nickname}</div>
                  <div className={styles.rankTime}>{formatTime(entry.time_seconds)}</div>
                  {isAdmin && (
                    <button className={styles.rankDeleteBtn} onClick={() => handleDeleteRanking(entry.user_id)} title="삭제">
                      ✕
                    </button>
                  )}
                </div>
              ))
            )}
          </div>

          <button className={styles.restartBtn} onClick={startGame}>다시 도전하기</button>
          <button className={styles.mainBtn} onClick={() => router.push("/main")}>메인으로 돌아가기</button>
        </div>
      )}
    </div>
  );
}
