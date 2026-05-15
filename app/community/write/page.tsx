"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase";
import styles from "../community.module.css";
import { hashPassword } from "@/lib/hash";

type BoardType = "자유게시판" | "공지" | "후기";
type TestCategory = "성격" | "연애" | "능력" | "기타";

const TEST_CATEGORIES: TestCategory[] = ["성격", "연애", "능력", "기타"];
const MAX_IMAGES = 3;

const TESTS_BY_CATEGORY: Record<TestCategory, string[]> = {
  성격: ["MBTI 테스트", "공감 능력 테스트"],
  연애: ["이상형 테스트", "MBTI 궁합 테스트"],
  능력: ["기억력 테스트", "추리력 테스트", "반응속도 테스트", "동체시력 테스트", "사격 능력 테스트"],
  기타: ["K-알바생 멘탈 테스트", "소비 습관 테스트", "수평사고 퀴즈"],
};

export default function WritePage() {
  const router = useRouter();
  const { user, isAdmin, nickname, level, loading } = useAuth();
  const [boardType, setBoardType] = useState<BoardType>("자유게시판");
  const [testCategory, setTestCategory] = useState<TestCategory | "">("");
  const [testName, setTestName] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [images, setImages] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!loading && !user) {
      if (window.confirm("로그인이 필요합니다.\n로그인하시겠습니까?")) {
        router.push("/login");
      } else {
        router.push("/community");
      }
    }
  }, [loading, user, router]);

  function handleBoardChange(value: BoardType) {
    setBoardType(value);
    if (value !== "후기") {
      setTestCategory("");
      setTestName("");
    }
  }

  function handleCategoryChange(cat: TestCategory) {
    setTestCategory(cat);
    setTestName("");
  }

  function handleImageAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const toAdd = files.slice(0, MAX_IMAGES - images.length);
    setImages((prev) => [...prev, ...toAdd]);
    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setImagePreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleImageRemove(index: number) {
    setImages((prev) => prev.filter((_, i) => i !== index));
    setImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!title.trim() || !content.trim() || !user) return;
    if (boardType === "후기" && !testName) return;
    if (!isAdmin && (password.length < 4 || password !== passwordConfirm)) return;
    setSubmitting(true);

    const supabase = createClient();
    const imageUrls: string[] = [];
    for (let i = 0; i < images.length; i++) {
      const file = images[i];
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/${Date.now()}_${i}.${ext}`;
      const { error } = await supabase.storage.from("post-image").upload(path, file);
      if (error) {
        console.error("이미지 업로드 실패:", error.message, error);
        alert(`이미지 업로드 실패: ${error.message}`);
        setSubmitting(false);
        return;
      }
      const { data: urlData } = supabase.storage.from("post-image").getPublicUrl(path);
      imageUrls.push(urlData.publicUrl);
    }

    const { data, error } = await supabase.from("posts").insert({
      user_id: user.id,
      board_type: boardType,
      title: title.trim(),
      content: content.trim(),
      nickname: nickname || user.email?.split("@")[0] || "익명",
      level,
      test_name: boardType === "후기" ? testName : null,
      post_password: !isAdmin && password ? hashPassword(password) : null,
      images: imageUrls,
    }).select("id").single();

    if (error) {
      alert("글 작성에 실패했습니다.");
      setSubmitting(false);
      return;
    }
    router.push(`/community/${data.id}`);
  }

  if (loading || !user) return null;

  const boardOptions: BoardType[] = isAdmin ? ["자유게시판", "공지", "후기"] : ["자유게시판", "후기"];
  const isReview = boardType === "후기";
  const passwordMismatch = password.length > 0 && passwordConfirm.length > 0 && password !== passwordConfirm;
  const canSubmit =
    !!title.trim() &&
    !!content.trim() &&
    !submitting &&
    (!isReview || !!testName) &&
    (isAdmin || (password.length >= 4 && passwordConfirm.length > 0 && !passwordMismatch));

  return (
    <div className={styles.formPage}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push("/community")}>← 게시판</button>
        <h1 className={styles.headerTitle}>글쓰기</h1>
        <div style={{ width: 60 }} />
      </header>

      <div className={styles.formContainer}>
        <div className={styles.formCard}>

          <div className={styles.formField}>
            <label className={styles.formLabel}>게시판</label>
            <select
              className={styles.formSelect}
              value={boardType}
              onChange={(e) => handleBoardChange(e.target.value as BoardType)}
            >
              {boardOptions.map((b) => <option key={b} value={b}>{b}</option>)}
            </select>
          </div>

          {isReview && (
            <>
              <div className={styles.formField}>
                <label className={styles.formLabel}>테스트 카테고리</label>
                <div className={styles.testBtnGroup}>
                  {TEST_CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      className={`${styles.testCategoryBtn} ${testCategory === cat ? styles.testCategoryBtnActive : ""}`}
                      onClick={() => handleCategoryChange(cat)}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {testCategory && (
                <div className={styles.formField}>
                  <label className={styles.formLabel}>테스트 선택</label>
                  <div className={styles.testBtnGroup}>
                    {TESTS_BY_CATEGORY[testCategory].map((name) => (
                      <button
                        key={name}
                        type="button"
                        className={`${styles.testNameBtn} ${testName === name ? styles.testNameBtnActive : ""}`}
                        onClick={() => setTestName(name)}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          <div className={styles.formField}>
            <label className={styles.formLabel}>제목</label>
            <input
              className={styles.formInput}
              placeholder="제목을 입력해주세요"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>내용</label>
            <textarea
              className={styles.formTextarea}
              placeholder="내용을 입력해주세요"
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>이미지 ({images.length}/{MAX_IMAGES})</label>
            <div className={styles.imageUploadArea}>
              {imagePreviews.map((src, i) => (
                <div key={i} className={styles.imagePreviewItem}>
                  <img src={src} className={styles.imagePreview} alt="" />
                  <button type="button" className={styles.imageRemoveBtn} onClick={() => handleImageRemove(i)}>×</button>
                </div>
              ))}
              {images.length < MAX_IMAGES && (
                <button type="button" className={styles.imageAddBtn} onClick={() => fileInputRef.current?.click()}>
                  <span>+</span>
                  <span>이미지 추가</span>
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleImageAdd} />
          </div>

          {!isAdmin && (
            <div className={styles.formField}>
              <label className={styles.formLabel}>
                게시물 비밀번호 <span className={styles.fieldNote}>(수정·삭제 시 필요, 4자리 이상)</span>
              </label>
              <div className={styles.passwordRow}>
                <input
                  type="password"
                  className={styles.formInput}
                  placeholder="비밀번호"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  maxLength={30}
                />
                <input
                  type="password"
                  className={`${styles.formInput} ${passwordMismatch ? styles.formInputError : ""}`}
                  placeholder="비밀번호 확인"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  maxLength={30}
                />
              </div>
              {passwordMismatch && <span className={styles.fieldError}>비밀번호가 일치하지 않습니다.</span>}
            </div>
          )}

          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={() => router.push("/community")}>취소</button>
            <button className={styles.submitBtn} onClick={handleSubmit} disabled={!canSubmit}>
              {submitting ? "등록 중..." : "등록"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
