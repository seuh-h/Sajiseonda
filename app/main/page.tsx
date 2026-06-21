"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import styles from "./main.module.css";
import { useAuth } from "@/hooks/useAuth";
import { useTranslation } from "@/hooks/useTranslation";
import { getLevelIcon, LEVEL_NAMES, LEVEL_ICONS } from "@/lib/levelSystem";
import { createClient } from "@/lib/supabase";

type Category = "전체" | "성격" | "연애" | "능력" | "기타" | "추리";

const TEST_CATEGORIES: Category[] = ["전체", "성격", "연애", "능력", "기타"];
const QUIZ_CATEGORIES: Category[] = ["추리"];

type CardKey = "mbti" | "love" | "mbtiLove" | "memory" | "alba" | "spending" | "empathy" | "detective" | "reaction" | "aim" | "shooting" | "mystery";

const CARDS: { cardKey: CardKey; categories: Category[]; href: string; img: string; alt: string; tag: string }[] = [
  { cardKey: "mbti",      categories: ["전체", "성격"], href: "/mbti",       img: "/img/mbti.svg",   alt: "MBTI 테스트",        tag: "성격" },
  { cardKey: "love",      categories: ["전체", "연애"], href: "/love",       img: "/img/love.svg",   alt: "이상형 테스트",       tag: "연애" },
  { cardKey: "mbtiLove",  categories: ["전체", "연애"], href: "/mbti-love",  img: "/img/love.svg",   alt: "MBTI 궁합 테스트",   tag: "연애" },
  { cardKey: "memory",    categories: ["전체", "능력"], href: "/memory",     img: "/img/memory.svg", alt: "기억력 테스트",       tag: "능력" },
  { cardKey: "alba",      categories: ["전체", "기타"], href: "/alba",       img: "/img/mbti.svg",   alt: "알바생 멘탈 테스트", tag: "기타" },
  { cardKey: "spending",  categories: ["전체", "기타"], href: "/spending",   img: "/img/mbti.svg",   alt: "소비 습관 테스트",   tag: "기타" },
  { cardKey: "empathy",   categories: ["전체", "성격"], href: "/empathy",    img: "/img/love.svg",   alt: "공감 능력 테스트",   tag: "성격" },
  { cardKey: "detective", categories: ["전체", "능력"], href: "/detective",  img: "/img/memory.svg", alt: "추리력 테스트",       tag: "능력" },
  { cardKey: "reaction",  categories: ["전체", "능력"], href: "/reaction",   img: "/img/memory.svg", alt: "반응속도 테스트",     tag: "능력" },
  { cardKey: "aim",       categories: ["전체", "능력"], href: "/aim",        img: "/img/memory.svg", alt: "동체시력 테스트",     tag: "능력" },
  { cardKey: "shooting",  categories: ["전체", "능력"], href: "/shooting",   img: "/img/memory.svg", alt: "사격 능력 테스트",   tag: "능력" },
  { cardKey: "mystery",   categories: ["전체", "추리"], href: "/mystery",    img: "/img/memory.svg", alt: "수평사고 퀴즈",       tag: "추리" },
];

type LikesState = Record<string, { count: number; liked: boolean }>;
type SortBy = "latest" | "popular" | "likes";
type CommunityBoard = "전체" | "자유게시판" | "공지" | "후기";
const COMMUNITY_BOARDS: CommunityBoard[] = ["전체", "자유게시판", "공지", "후기"];

interface CommunityPost {
  id: string;
  board_type: string;
  title: string;
  nickname: string;
  level: number;
  view_count: number;
  created_at: string;
  comment_count: number;
}

function formatRelativeTime(dateStr: string) {
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  if (diffSec < 60) return `${diffSec}초 전`;
  if (diffMin < 60) return `${diffMin}분 전`;
  if (diffHour < 24) return `${diffHour}시간 전`;
  const d = new Date(dateStr);
  return `${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")}`;
}

export default function MainPage() {
  const [active, setActive] = useState<Category>("전체");
  const [currentPage, setCurrentPage] = useState(0);
  const [sortBy, setSortBy] = useState<SortBy>("latest");
  const [likes, setLikes] = useState<LikesState>({});
  const [views, setViews] = useState<Record<string, number>>({});
  const [communityBoard, setCommunityBoard] = useState<CommunityBoard>("전체");
  const [communityPosts, setCommunityPosts] = useState<CommunityPost[]>([]);
  const { user, level, isAdmin, avatarUrl, nickname, loading } = useAuth();
  const { t } = useTranslation();
  const router = useRouter();

  const getCatLabel = (cat: Category) => ({
    '전체': t.main.categories.all,
    '성격': t.main.categories.personality,
    '연애': t.main.categories.love,
    '능력': t.main.categories.ability,
    '기타': t.main.categories.other,
    '추리': t.main.categories.mystery,
  }[cat]);

  const getTagLabel = (tag: string) => ({
    '성격': t.main.categories.personality,
    '연애': t.main.categories.love,
    '능력': t.main.categories.ability,
    '기타': t.main.categories.other,
    '추리': t.main.categories.mystery,
  }[tag] ?? tag);

  const getBoardLabel = (board: CommunityBoard) => ({
    '전체': t.main.community.boards.all,
    '자유게시판': t.main.community.boards.free,
    '공지': t.main.community.boards.notice,
    '후기': t.main.community.boards.review,
  }[board]);

  const SORT_OPTIONS: { value: SortBy; label: string }[] = [
    { value: "latest",  label: t.main.sort.latest },
    { value: "popular", label: t.main.sort.popular },
    { value: "likes",   label: t.main.sort.likes },
  ];

  const visibleCards = CARDS.filter((c) => c.categories.includes(active));
  const sortedCards = [...visibleCards].sort((a, b) => {
    const idA = a.href.slice(1);
    const idB = b.href.slice(1);
    if (sortBy === "latest") return CARDS.indexOf(b) - CARDS.indexOf(a);
    if (sortBy === "popular") return (views[idB] ?? 0) - (views[idA] ?? 0);
    if (sortBy === "likes") return (likes[idB]?.count ?? 0) - (likes[idA]?.count ?? 0);
    return 0;
  });
  const CARDS_PER_PAGE = 6;
  const totalPages = Math.ceil(sortedCards.length / CARDS_PER_PAGE);
  const pagedCards = sortedCards.slice(currentPage * CARDS_PER_PAGE, (currentPage + 1) * CARDS_PER_PAGE);

  useEffect(() => {
    setCurrentPage(0);
  }, [active, sortBy]);

  const fetchViews = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("test_views").select("test_id, count");
    if (!data) return;
    const next: Record<string, number> = {};
    data.forEach((v) => { next[v.test_id] = v.count; });
    setViews(next);
  }, []);

  const incrementView = async (testId: string) => {
    setViews((prev) => ({ ...prev, [testId]: (prev[testId] ?? 0) + 1 }));
    const supabase = createClient();
    await supabase.rpc("increment_test_view", { p_test_id: testId });
  };

  const fetchLikes = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("test_likes").select("test_id, user_id");
    if (!data) return;

    const next: LikesState = {};
    CARDS.forEach((card) => {
      const id = card.href.slice(1);
      const cardLikes = data.filter((l) => l.test_id === id);
      next[id] = {
        count: cardLikes.length,
        liked: user ? cardLikes.some((l) => l.user_id === user.id) : false,
      };
    });
    setLikes(next);
  }, [user]);

  useEffect(() => {
    if (!loading) {
      fetchLikes();
      fetchViews();
    }
  }, [loading, fetchLikes, fetchViews]);

  async function handleLike(testId: string) {
    if (!user) { router.push("/login"); return; }

    const isLiked = likes[testId]?.liked;
    setLikes((prev) => ({
      ...prev,
      [testId]: { count: (prev[testId]?.count ?? 0) + (isLiked ? -1 : 1), liked: !isLiked },
    }));

    const supabase = createClient();
    if (isLiked) {
      await supabase.from("test_likes").delete().eq("user_id", user.id).eq("test_id", testId);
    } else {
      await supabase.from("test_likes").insert({ user_id: user.id, test_id: testId });
    }
  }

  const fetchCommunityPosts = useCallback(async () => {
    if (!user) return;
    const supabase = createClient();

    let posts: { id: string; board_type: string; title: string; nickname: string; level: number; view_count: number; created_at: string }[] = [];

    if (communityBoard === "공지") {
      const { data } = await supabase
        .from("posts")
        .select("id, board_type, title, nickname, level, view_count, created_at")
        .eq("board_type", "공지")
        .order("created_at", { ascending: false })
        .limit(10);
      posts = data ?? [];
    } else {
      const noticeQuery = supabase
        .from("posts")
        .select("id, board_type, title, nickname, level, view_count, created_at")
        .eq("board_type", "공지")
        .order("created_at", { ascending: false })
        .limit(2);

      const contentQuery = communityBoard === "전체"
        ? supabase.from("posts").select("id, board_type, title, nickname, level, view_count, created_at").neq("board_type", "공지").order("created_at", { ascending: false }).limit(10)
        : supabase.from("posts").select("id, board_type, title, nickname, level, view_count, created_at").eq("board_type", communityBoard).order("created_at", { ascending: false }).limit(10);

      const [{ data: notices }, { data: others }] = await Promise.all([noticeQuery, contentQuery]);
      posts = [...(notices ?? []), ...(others ?? [])];
    }

    if (posts.length === 0) { setCommunityPosts([]); return; }

    const postIds = posts.map((p) => p.id);
    const { data: commentRows } = await supabase.from("comments").select("post_id").in("post_id", postIds);
    const commentMap: Record<string, number> = {};
    commentRows?.forEach((c) => { commentMap[c.post_id] = (commentMap[c.post_id] ?? 0) + 1; });

    setCommunityPosts(posts.map((p) => ({ ...p, comment_count: commentMap[p.id] ?? 0 })));
  }, [user, communityBoard]);

  useEffect(() => {
    if (!loading) fetchCommunityPosts();
  }, [loading, fetchCommunityPosts]);

  async function handleLogout() {
    if (!window.confirm("로그아웃 하시겠습니까?")) return;
    const supabase = createClient();
    await supabase.auth.signOut();
    router.refresh();
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <nav className={styles.navbar}>
          <div className={styles.logo}>
            <Image src="/img/logo-icon.svg" alt="사지선다 로고" width={32} height={32} />
            사지선다
          </div>
          <ul className={styles.navMenu}>
            {TEST_CATEGORIES.map((cat) => (
              <li key={cat} className={styles.navItem}>
                <button
                  className={`${styles.navLink} ${active === cat ? styles.navLinkActive : ""}`}
                  onClick={() => setActive(cat)}
                >
                  {getCatLabel(cat)}
                </button>
              </li>
            ))}
            <li className={styles.navItem}><span className={styles.navDivider} /></li>
            {QUIZ_CATEGORIES.map((cat) => (
              <li key={cat} className={styles.navItem}>
                <button
                  className={`${styles.navLink} ${active === cat ? styles.navLinkActive : ""}`}
                  onClick={() => setActive(cat)}
                >
                  {getCatLabel(cat)}
                </button>
              </li>
            ))}
            <li className={styles.navItem}><span className={styles.navDivider} /></li>
            <li className={styles.navItem}>
              <Link href="/community" className={styles.navLink}>{t.main.community.title}</Link>
            </li>
          </ul>
          <div className={styles.navActions}>
            {!loading && (
              user ? (
                <>
                  {isAdmin && (
                    <>
                      <span className={styles.adminBadge}>{t.main.admin}</span>
                      <Link href="/admin" className={styles.logoutBtn}>{t.main.adminPanel}</Link>
                    </>
                  )}
                  <div className={styles.levelWrapper}>
                    <span className={styles.levelIcon}>{getLevelIcon(level)}</span>
                    <div className={styles.levelTooltip}>
                      {Object.entries(LEVEL_NAMES).map(([lv, name]) => {
                        const lvNum = Number(lv);
                        return (
                          <div key={lv} className={`${styles.levelRow} ${lvNum === level ? styles.levelRowActive : ''}`}>
                            <span className={styles.levelRowIcon}>{LEVEL_ICONS[lvNum]}</span>
                            <span className={styles.levelRowName}>{name}</span>
                            {lvNum === level
                              ? <span className={styles.levelRowCurrent}>현재</span>
                              : lvNum === 6 && !isAdmin
                                ? <span className={styles.levelRowLocked}>등업 불가</span>
                                : null
                            }
                          </div>
                        );
                      })}
                    </div>
                  </div>
                  <Link href="/profile" className={styles.avatarBtn}>
                    {avatarUrl ? (
                      <Image src={avatarUrl} alt="프로필" fill className={styles.avatarBtnImg} />
                    ) : (
                      <span className={styles.avatarBtnFallback}>
                        {(nickname?.[0] ?? user.email?.[0])?.toUpperCase()}
                      </span>
                    )}
                  </Link>
                  <button className={styles.logoutBtn} onClick={handleLogout}>{t.main.logout}</button>
                </>
              ) : (
                <Link href="/login" className={styles.loginBtn}>{t.main.login}</Link>
              )
            )}
          </div>
        </nav>
      </header>

      <main className={styles.main}>
        <div className={styles.contentContainer}>
          <div className={styles.sectionHeader}>
            <h1 className={styles.categoryTitle}>{getCatLabel(active)}</h1>
            <p className={styles.sectionCount}>{t.main.testCount.replace('{n}', String(visibleCards.length))}</p>
          </div>
          <div className={styles.sortBar}>
            {SORT_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                className={`${styles.sortBtn} ${sortBy === opt.value ? styles.sortBtnActive : ""}`}
                onClick={() => setSortBy(opt.value)}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <div className={styles.gridSection}>
            {totalPages > 1 && (
              <button
                className={`${styles.gridArrow} ${styles.gridArrowLeft}`}
                onClick={() => setCurrentPage((p) => Math.max(0, p - 1))}
                disabled={currentPage === 0}
                aria-label="이전 페이지"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="15,18 9,12 15,6" />
                </svg>
              </button>
            )}
            <div className={styles.projectGrid}>
              {pagedCards.map((card) => {
                const testId = card.href.slice(1);
                const likeData = likes[testId];
                const cardInfo = t.main.cards[card.cardKey];
                return (
                  <div key={card.href} className={styles.cardWrapper}>
                    <Link href={card.href} className={styles.projectCard} onClick={() => incrementView(testId)}>
                      <Image src={card.img} alt={cardInfo.title} width={420} height={560} className={styles.cardImage} />
                      <div className={styles.cardOverlay}>
                        <span className={styles.cardTag}>{getTagLabel(card.tag)}</span>
                        <div className={styles.cardBottom}>
                          <p className={styles.cardDesc}>{cardInfo.desc}</p>
                          <h2 className={styles.cardTitle}>{cardInfo.title}</h2>
                          <span className={styles.cardCta}>{t.main.startCta}</span>
                        </div>
                      </div>
                    </Link>
                    <div className={styles.cardFooter}>
                      <button
                        className={`${styles.likeBtn} ${likeData?.liked ? styles.likeBtnActive : ""}`}
                        onClick={() => handleLike(testId)}
                      >
                        <svg className={styles.likeHeart} viewBox="0 0 24 24" width="20" height="20">
                          {likeData?.liked ? (
                            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" fill="#f43f5e" />
                          ) : (
                            <path d="M16.5 3c-1.74 0-3.41.81-4.5 2.09C10.91 3.81 9.24 3 7.5 3 4.42 3 2 5.42 2 8.5c0 3.78 3.4 6.86 8.55 11.54L12 21.35l1.45-1.32C18.6 15.36 22 12.28 22 8.5 22 5.42 19.58 3 16.5 3zm-4.4 15.55l-.1.1-.1-.1C7.14 14.24 4 11.39 4 8.5 4 6.5 5.5 5 7.5 5c1.54 0 3.04.99 3.57 2.36h1.87C13.46 5.99 14.96 5 16.5 5c2 0 3.5 1.5 3.5 3.5 0 2.89-3.14 5.74-7.9 10.05z" fill="#6e6e73" />
                          )}
                        </svg>
                        <span className={styles.likeCount}>{likeData?.count ?? 0}</span>
                      </button>
                      <div className={styles.viewCount}>
                        <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="#86868b" strokeWidth="1.8">
                          <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                          <circle cx="12" cy="12" r="3" />
                        </svg>
                        <span>{views[testId] ?? 0}</span>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            {totalPages > 1 && (
              <button
                className={`${styles.gridArrow} ${styles.gridArrowRight}`}
                onClick={() => setCurrentPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={currentPage === totalPages - 1}
                aria-label="다음 페이지"
              >
                <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="9,18 15,12 9,6" />
                </svg>
              </button>
            )}
          </div>

          {totalPages > 1 && (
            <div className={styles.pagination}>
              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  className={`${styles.pageDot} ${i === currentPage ? styles.pageDotActive : ""}`}
                  onClick={() => setCurrentPage(i)}
                  aria-label={`${i + 1}페이지`}
                />
              ))}
            </div>
          )}
        </div>

        <div className={styles.communitySection}>
          <div className={styles.communitySectionHeader}>
            <h2 className={styles.communitySectionTitle}>{t.main.community.title}</h2>
            <Link href="/community" className={styles.communityMoreBtn}>{t.main.community.more}</Link>
          </div>

          <div className={styles.communityBoardTabs}>
            {COMMUNITY_BOARDS.map((board) => (
              <button
                key={board}
                className={`${styles.communityBoardTab} ${communityBoard === board ? styles.communityBoardTabActive : ""}`}
                onClick={() => setCommunityBoard(board)}
              >
                {getBoardLabel(board)}
              </button>
            ))}
            <button
              className={styles.communityWriteBtn}
              onClick={() => user ? router.push("/community/write") : router.push("/login")}
            >
              {t.main.community.write}
            </button>
          </div>

          {!user ? (
            <div className={styles.communityLoginNote}>
              <span>{t.main.community.loginNote}</span>
              <button className={styles.communityLoginBtn} onClick={() => router.push("/login")}>
                {t.main.community.loginBtn}
              </button>
            </div>
          ) : communityPosts.length === 0 ? (
            <div className={styles.communityEmpty}>{t.main.community.empty}</div>
          ) : (
            <div className={styles.communityPostList}>
              {communityPosts.map((post) => (
                <div
                  key={post.id}
                  className={`${styles.communityPostRow} ${post.board_type === "공지" ? styles.communityPostRowNotice : ""}`}
                  onClick={() => router.push(`/community/${post.id}`)}
                >
                  <span className={`${styles.communityBadge} ${post.board_type === "공지" ? styles.communityBadgeNotice : post.board_type === "후기" ? styles.communityBadgeReview : styles.communityBadgeFree}`}>
                    {post.board_type}
                  </span>
                  <span className={styles.communityPostTitle}>
                    {post.title}
                    {post.comment_count > 0 && (
                      <span className={styles.communityCommentCount}> [{post.comment_count}]</span>
                    )}
                  </span>
                  <span className={styles.communityPostNickname}>
                    {getLevelIcon(post.level)} {post.nickname}
                  </span>
                  <span className={styles.communityPostDate}>
                    {formatRelativeTime(post.created_at)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
