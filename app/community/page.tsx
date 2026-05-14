"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase";
import { getLevelIcon } from "@/lib/levelSystem";
import styles from "./community.module.css";

type BoardType = "전체" | "자유게시판" | "공지" | "후기";
type ReviewCategory = "전체" | "성격" | "연애" | "능력" | "기타";
const BOARDS: BoardType[] = ["전체", "자유게시판", "공지", "후기"];
const REVIEW_CATEGORIES: ReviewCategory[] = ["전체", "성격", "연애", "능력", "기타"];
const TESTS_BY_CATEGORY: Record<Exclude<ReviewCategory, "전체">, string[]> = {
  성격: ["MBTI 테스트", "공감 능력 테스트"],
  연애: ["이상형 테스트", "MBTI 궁합 테스트"],
  능력: ["기억력 테스트", "추리력 테스트", "반응속도 테스트", "동체시력 테스트", "사격 능력 테스트"],
  기타: ["K-알바생 멘탈 테스트", "소비 습관 테스트", "수평사고 퀴즈"],
};
const POSTS_PER_PAGE = 15;

interface Post {
  id: string;
  board_type: string;
  title: string;
  nickname: string;
  level: number;
  view_count: number;
  created_at: string;
  comment_count: number;
  like_count: number;
  test_name: string | null;
}

function getBadgeClass(boardType: string, s: Record<string, string>) {
  if (boardType === "공지") return s.badgeNotice;
  if (boardType === "후기") return s.badgeReview;
  return s.badgeFree;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  if (diffSec < 60) return `${diffSec}초 전`;
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function CommunityPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [activeBoard, setActiveBoard] = useState<BoardType>("전체");
  const [reviewCategory, setReviewCategory] = useState<ReviewCategory>("전체");
  const [posts, setPosts] = useState<Post[]>([]);
  const [currentPage, setCurrentPage] = useState(0);
  const [totalCount, setTotalCount] = useState(0);
  const [postsLoading, setPostsLoading] = useState(false);

  const requireLogin = useCallback(() => {
    if (window.confirm("로그인이 필요합니다.\n로그인하시겠습니까?")) {
      router.push("/login");
    }
  }, [router]);

  const fetchPosts = useCallback(async () => {
    setPostsLoading(true);
    const supabase = createClient();

    type RawPost = { id: string; board_type: string; title: string; nickname: string; level: number; view_count: number; created_at: string; test_name: string | null };
    let allPosts: RawPost[] = [];
    let total = 0;

    if (activeBoard === "전체") {
      const [{ data: noticeData }, { data: otherData, count }] = await Promise.all([
        supabase.from("posts")
          .select("id, board_type, title, nickname, level, view_count, created_at, test_name")
          .eq("board_type", "공지")
          .order("created_at", { ascending: false })
          .limit(3),
        supabase.from("posts")
          .select("id, board_type, title, nickname, level, view_count, created_at, test_name", { count: "exact" })
          .neq("board_type", "공지")
          .order("created_at", { ascending: false })
          .range(currentPage * POSTS_PER_PAGE, (currentPage + 1) * POSTS_PER_PAGE - 1),
      ]);
      total = count ?? 0;
      allPosts = [...(noticeData ?? []), ...(otherData ?? [])];
    } else {
      let q = supabase
        .from("posts")
        .select("id, board_type, title, nickname, level, view_count, created_at, test_name", { count: "exact" })
        .eq("board_type", activeBoard)
        .order("created_at", { ascending: false })
        .range(currentPage * POSTS_PER_PAGE, (currentPage + 1) * POSTS_PER_PAGE - 1);
      if (activeBoard === "후기" && reviewCategory !== "전체") {
        q = q.in("test_name", TESTS_BY_CATEGORY[reviewCategory]);
      }
      const { data, count } = await q;
      total = count ?? 0;
      allPosts = data ?? [];
    }

    setTotalCount(total);
    if (allPosts.length === 0) { setPosts([]); setPostsLoading(false); return; }

    const postIds = allPosts.map((p) => p.id);
    const [{ data: commentRows }, { data: likeRows }] = await Promise.all([
      supabase.from("comments").select("post_id").in("post_id", postIds),
      supabase.from("post_likes").select("post_id").in("post_id", postIds),
    ]);

    const commentMap: Record<string, number> = {};
    const likeMap: Record<string, number> = {};
    commentRows?.forEach((c) => { commentMap[c.post_id] = (commentMap[c.post_id] ?? 0) + 1; });
    likeRows?.forEach((l) => { likeMap[l.post_id] = (likeMap[l.post_id] ?? 0) + 1; });

    setPosts(allPosts.map((p) => ({ ...p, comment_count: commentMap[p.id] ?? 0, like_count: likeMap[p.id] ?? 0 })));
    setPostsLoading(false);
  }, [activeBoard, currentPage, reviewCategory]);

  useEffect(() => {
    if (!loading && user) fetchPosts();
  }, [loading, user, fetchPosts]);

  useEffect(() => { setCurrentPage(0); setReviewCategory("전체"); }, [activeBoard]);
  useEffect(() => { setCurrentPage(0); }, [reviewCategory]);

  const totalPages = Math.ceil(totalCount / POSTS_PER_PAGE);

  const handlePostClick = (postId: string) => {
    if (!user) { requireLogin(); return; }
    router.push(`/community/${postId}`);
  };

  const handleWriteClick = () => {
    if (!user) { requireLogin(); return; }
    router.push("/community/write");
  };

  const handleBoardClick = (board: BoardType) => {
    if (!user) { requireLogin(); return; }
    setActiveBoard(board);
  };

  if (loading) return null;

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push("/main")}>← 메인으로</button>
        <h1 className={styles.headerTitle}>커뮤니티</h1>
        <div style={{ width: 60 }} />
      </header>

      <main className={styles.main}>
        <div className={styles.container}>
          <div className={styles.boardTabsRow}>
            <div className={styles.boardTabs}>
              {BOARDS.map((board) => (
                <button
                  key={board}
                  className={`${styles.boardTab} ${activeBoard === board ? styles.boardTabActive : ""}`}
                  onClick={() => handleBoardClick(board)}
                >
                  {board}
                </button>
              ))}
            </div>
            <button className={styles.writeBtn} onClick={handleWriteClick}>글쓰기</button>
          </div>

          {activeBoard === "후기" && user && (
            <div className={styles.reviewCategoryRow}>
              {REVIEW_CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  className={`${styles.reviewCategoryBtn} ${reviewCategory === cat ? styles.reviewCategoryBtnActive : ""}`}
                  onClick={() => setReviewCategory(cat)}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}

          {!user ? (
            <div className={styles.loginPrompt}>
              <p className={styles.loginPromptText}>게시판을 이용하려면 로그인이 필요합니다.</p>
              <button className={styles.loginPromptBtn} onClick={() => router.push("/login")}>로그인하기</button>
            </div>
          ) : postsLoading ? (
            <div className={styles.empty}>불러오는 중...</div>
          ) : posts.length === 0 ? (
            <div className={styles.empty}>게시글이 없습니다.</div>
          ) : (
            <>
              <div className={styles.postList}>
                {posts.map((post) => (
                  <div key={post.id} className={`${styles.postRow} ${post.board_type === "공지" ? styles.postRowNotice : ""}`} onClick={() => handlePostClick(post.id)}>
                    <span className={`${styles.boardBadge} ${getBadgeClass(post.board_type, styles)}`}>
                      {post.board_type}
                    </span>
                    <div className={styles.postMain}>
                      <span className={styles.postTitle}>{post.title}</span>
                      {post.comment_count > 0 && (
                        <span className={styles.commentCount}>[{post.comment_count}]</span>
                      )}
                      {post.board_type === "후기" && post.test_name && (
                        <span className={styles.testNameTag}>{post.test_name}</span>
                      )}
                    </div>
                    <div className={styles.postMeta}>
                      <span className={styles.postAuthor}>
                        {getLevelIcon(post.level)} {post.nickname}
                      </span>
                      <span className={styles.postDate}>{formatDate(post.created_at)}</span>
                      <span className={styles.postViews}>👁 {post.view_count}</span>
                      <span className={styles.postLikes}>♥ {post.like_count}</span>
                    </div>
                  </div>
                ))}
              </div>

              {totalPages > 1 && (
                <div className={styles.pagination}>
                  {Array.from({ length: totalPages }).map((_, i) => (
                    <button
                      key={i}
                      className={`${styles.pageDot} ${i === currentPage ? styles.pageDotActive : ""}`}
                      onClick={() => setCurrentPage(i)}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
