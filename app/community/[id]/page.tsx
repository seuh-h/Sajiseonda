"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase";
import { getLevelIcon } from "@/lib/levelSystem";
import styles from "../community.module.css";
import { hashPassword } from "@/lib/hash";

interface Post {
  id: string;
  user_id: string;
  board_type: string;
  title: string;
  content: string;
  nickname: string;
  level: number;
  view_count: number;
  created_at: string;
  test_name: string | null;
  post_password: string | null;
  images: string[] | null;
}

interface Comment {
  id: string;
  user_id: string;
  content: string;
  nickname: string;
  level: number;
  created_at: string;
}

function getBadgeClass(boardType: string, s: Record<string, string>) {
  if (boardType === "공지") return s.badgeNotice;
  if (boardType === "후기") return s.badgeReview;
  return s.badgeFree;
}

function formatDate(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, "0")}.${String(d.getDate()).padStart(2, "0")} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
}


export default function PostDetailPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin, nickname, level, loading } = useAuth();

  const [post, setPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [liked, setLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);
  const [commentInput, setCommentInput] = useState("");
  const [submittingComment, setSubmittingComment] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const [passwordModal, setPasswordModal] = useState<null | "edit" | "delete">(null);
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState(false);

  const requireLogin = useCallback(() => {
    if (window.confirm("로그인이 필요합니다.\n로그인하시겠습니까?")) {
      router.push("/login");
    }
  }, [router]);

  const fetchPost = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("posts").select("*").eq("id", id).single();
    if (!data) { router.push("/community"); return; }
    setPost(data);
    await supabase.rpc("increment_post_view", { p_post_id: id });
  }, [id, router]);

  const fetchComments = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase
      .from("comments")
      .select("*")
      .eq("post_id", id)
      .order("created_at", { ascending: true });
    setComments(data ?? []);
  }, [id]);

  const fetchLikes = useCallback(async () => {
    const supabase = createClient();
    const { data } = await supabase.from("post_likes").select("user_id").eq("post_id", id);
    setLikeCount(data?.length ?? 0);
    if (user) setLiked(data?.some((l) => l.user_id === user.id) ?? false);
  }, [id, user]);

  useEffect(() => {
    if (!loading) {
      if (!user) { requireLogin(); return; }
      Promise.all([fetchPost(), fetchComments(), fetchLikes()]).then(() => setPageLoading(false));
    }
  }, [loading, user, fetchPost, fetchComments, fetchLikes, requireLogin]);

  async function handleLike() {
    if (!user) { requireLogin(); return; }
    const supabase = createClient();
    if (liked) {
      setLiked(false);
      setLikeCount((c) => c - 1);
      await supabase.from("post_likes").delete().eq("post_id", id).eq("user_id", user.id);
    } else {
      setLiked(true);
      setLikeCount((c) => c + 1);
      await supabase.from("post_likes").insert({ post_id: id, user_id: user.id });
    }
  }

  async function deletePost() {
    const supabase = createClient();
    await supabase.from("posts").delete().eq("id", id);
    router.push("/community");
  }

  function handleEditClick() {
    if (!isAdmin && post?.post_password) {
      setPasswordModal("edit");
      setPasswordInput("");
      setPasswordError(false);
    } else {
      router.push(`/community/edit/${id}`);
    }
  }

  function handleDeleteClick() {
    if (!isAdmin && post?.post_password) {
      setPasswordModal("delete");
      setPasswordInput("");
      setPasswordError(false);
    } else {
      if (window.confirm("게시글을 삭제하시겠습니까?")) deletePost();
    }
  }

  function handlePasswordConfirm() {
    const hashed = hashPassword(passwordInput);
    if (hashed !== post?.post_password) {
      setPasswordError(true);
      return;
    }
    const mode = passwordModal;
    setPasswordModal(null);
    if (mode === "edit") {
      router.push(`/community/edit/${id}`);
    } else {
      deletePost();
    }
  }

  async function handleSubmitComment() {
    if (!commentInput.trim() || !user) return;
    setSubmittingComment(true);
    const supabase = createClient();
    await supabase.from("comments").insert({
      post_id: id,
      user_id: user.id,
      content: commentInput.trim(),
      nickname: nickname || user.email?.split("@")[0] || "익명",
      level,
    });
    setCommentInput("");
    await fetchComments();
    setSubmittingComment(false);
  }

  async function handleDeleteComment(commentId: string) {
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
    const supabase = createClient();
    await supabase.from("comments").delete().eq("id", commentId);
    await fetchComments();
  }

  if (loading || pageLoading || !post) return null;

  const canEditPost = user && (isAdmin || (user.id === post.user_id && post.board_type !== "공지"));

  return (
    <div className={styles.detailPage}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push("/community")}>← 게시판</button>
        <h1 className={styles.headerTitle}>커뮤니티</h1>
        <div style={{ width: 60 }} />
      </header>

      {/* Password modal */}
      {passwordModal && (
        <div className={styles.modalOverlay} onClick={() => setPasswordModal(null)}>
          <div className={styles.modalBox} onClick={(e) => e.stopPropagation()}>
            <h2 className={styles.modalTitle}>
              {passwordModal === "edit" ? "수정 확인" : "삭제 확인"}
            </h2>
            <p className={styles.modalDesc}>게시물 비밀번호를 입력해주세요.</p>
            <input
              type="password"
              className={`${styles.modalInput} ${passwordError ? styles.modalInputError : ""}`}
              placeholder="비밀번호"
              value={passwordInput}
              onChange={(e) => { setPasswordInput(e.target.value); setPasswordError(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") handlePasswordConfirm(); }}
              autoFocus
            />
            {passwordError && <span className={styles.modalErrorText}>비밀번호가 틀렸습니다.</span>}
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => setPasswordModal(null)}>취소</button>
              <button
                className={passwordModal === "delete" ? styles.deleteBtn : styles.submitBtn}
                onClick={handlePasswordConfirm}
                disabled={!passwordInput}
              >
                {passwordModal === "delete" ? "삭제" : "확인"}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className={styles.detailContainer}>
        <div className={styles.detailCard}>
          <div className={styles.detailBadgeRow}>
            <span className={`${styles.detailBadge} ${getBadgeClass(post.board_type, styles)}`}>
              {post.board_type}
            </span>
            {post.board_type === "후기" && post.test_name && (
              <span className={styles.testNameTag}>{post.test_name}</span>
            )}
          </div>
          <h2 className={styles.detailTitle}>{post.title}</h2>

          <div className={styles.detailMetaRow}>
            <span className={styles.detailAuthor}>
              {getLevelIcon(post.level)} {post.nickname}
            </span>
            <span className={styles.detailDate}>{formatDate(post.created_at)}</span>
            <span className={styles.detailViews}>조회 {post.view_count}</span>
          </div>

          <p className={styles.detailContent}>{post.content}</p>

          {post.images && post.images.length > 0 && (
            <div className={styles.detailImages}>
              {post.images.map((url, i) => (
                <a key={i} href={url} target="_blank" rel="noopener noreferrer" className={styles.detailImageLink}>
                  <img src={url} className={styles.detailImage} alt={`이미지 ${i + 1}`} />
                </a>
              ))}
            </div>
          )}

          <div className={styles.detailActions}>
            <button
              className={`${styles.likeBtn} ${liked ? styles.likeBtnActive : ""}`}
              onClick={handleLike}
            >
              ♥ {likeCount}
            </button>
            {canEditPost && (
              <div className={styles.postBtns}>
                <button className={styles.editBtn} onClick={handleEditClick}>수정</button>
                <button className={styles.deleteBtn} onClick={handleDeleteClick}>삭제</button>
              </div>
            )}
          </div>
        </div>

        {/* Comments */}
        <div className={styles.commentsSection}>
          <h3 className={styles.commentsTitle}>댓글 {comments.length}개</h3>

          <div className={styles.commentList}>
            {comments.length === 0 ? (
              <div className={styles.commentEmpty}>첫 번째 댓글을 남겨보세요.</div>
            ) : (
              comments.map((c) => (
                <div key={c.id} className={styles.commentItem}>
                  <div className={styles.commentHeader}>
                    <span className={styles.commentAuthor}>
                      {getLevelIcon(c.level)} {c.nickname}
                    </span>
                    <div className={styles.commentRight}>
                      <span className={styles.commentDate}>{formatDate(c.created_at)}</span>
                      {(user?.id === c.user_id || isAdmin) && (
                        <button className={styles.commentDeleteBtn} onClick={() => handleDeleteComment(c.id)}>삭제</button>
                      )}
                    </div>
                  </div>
                  <p className={styles.commentContent}>{c.content}</p>
                </div>
              ))
            )}
          </div>

          {user ? (
            <div className={styles.commentInputRow}>
              <textarea
                className={styles.commentInput}
                placeholder="댓글을 입력해주세요"
                value={commentInput}
                onChange={(e) => setCommentInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSubmitComment();
                  }
                }}
              />
              <button
                className={styles.commentSubmitBtn}
                onClick={handleSubmitComment}
                disabled={!commentInput.trim() || submittingComment}
              >
                등록
              </button>
            </div>
          ) : (
            <p className={styles.commentLoginNote}>댓글을 작성하려면 로그인이 필요합니다.</p>
          )}
        </div>
      </div>
    </div>
  );
}
