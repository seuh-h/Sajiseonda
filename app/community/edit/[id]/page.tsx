"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { createClient } from "@/lib/supabase";
import styles from "../../community.module.css";
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

function findCategory(name: string): TestCategory | "" {
  for (const cat of TEST_CATEGORIES) {
    if (TESTS_BY_CATEGORY[cat].includes(name)) return cat;
  }
  return "";
}

function getStoragePath(url: string): string {
  const marker = "/post-images/";
  const idx = url.indexOf(marker);
  return idx >= 0 ? url.slice(idx + marker.length) : "";
}


export default function EditPostPage() {
  const router = useRouter();
  const { id } = useParams<{ id: string }>();
  const { user, isAdmin, loading } = useAuth();

  const [boardType, setBoardType] = useState<BoardType>("자유게시판");
  const [testCategory, setTestCategory] = useState<TestCategory | "">("");
  const [testName, setTestName] = useState("");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [existingImages, setExistingImages] = useState<string[]>([]);
  const originalImagesRef = useRef<string[]>([]);
  const [newImages, setNewImages] = useState<File[]>([]);
  const [newImagePreviews, setNewImagePreviews] = useState<string[]>([]);
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [storedPasswordHash, setStoredPasswordHash] = useState<string | null>(null);
  const [verified, setVerified] = useState(false);
  const [pwInput, setPwInput] = useState("");
  const [pwError, setPwError] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [pageLoading, setPageLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (loading) return;
    if (!user) {
      if (window.confirm("로그인이 필요합니다.\n로그인하시겠습니까?")) {
        router.push("/login");
      } else {
        router.push("/community");
      }
      return;
    }

    const supabase = createClient();
    supabase
      .from("posts")
      .select("user_id, board_type, title, content, test_name, post_password, images")
      .eq("id", id)
      .single()
      .then(({ data }) => {
        if (!data) { router.push("/community"); return; }
        if (data.user_id !== user.id && !isAdmin) { router.push(`/community/${id}`); return; }

        setBoardType(data.board_type as BoardType);
        setTitle(data.title);
        setContent(data.content);
        if (data.test_name) {
          setTestName(data.test_name);
          setTestCategory(findCategory(data.test_name));
        }
        const imgs = data.images ?? [];
        setExistingImages(imgs);
        originalImagesRef.current = imgs;
        setStoredPasswordHash(data.post_password ?? null);

        if (!data.post_password || isAdmin) {
          setVerified(true);
        }
        setPageLoading(false);
      });
  }, [loading, user, isAdmin, id, router]);

  function handlePasswordVerify() {
    if (!storedPasswordHash) { setVerified(true); return; }
    const hashed = hashPassword(pwInput);
    if (hashed === storedPasswordHash) {
      setVerified(true);
      setPwError(false);
    } else {
      setPwError(true);
    }
  }

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

  function handleExistingImageRemove(index: number) {
    setExistingImages((prev) => prev.filter((_, i) => i !== index));
  }

  function handleNewImageAdd(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const totalCurrent = existingImages.length + newImages.length;
    const toAdd = files.slice(0, MAX_IMAGES - totalCurrent);
    setNewImages((prev) => [...prev, ...toAdd]);
    toAdd.forEach((file) => {
      const reader = new FileReader();
      reader.onload = (ev) => {
        setNewImagePreviews((prev) => [...prev, ev.target?.result as string]);
      };
      reader.readAsDataURL(file);
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  function handleNewImageRemove(index: number) {
    setNewImages((prev) => prev.filter((_, i) => i !== index));
    setNewImagePreviews((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!title.trim() || !content.trim() || !user) return;
    if (boardType === "후기" && !testName) return;

    const pwMismatch = newPassword.length > 0 && newPassword !== newPasswordConfirm;
    if (!isAdmin && newPassword.length > 0 && (newPassword.length < 4 || pwMismatch)) return;
    setSubmitting(true);

    const supabase = createClient();

    // Delete removed images from storage
    const removedUrls = originalImagesRef.current.filter((url) => !existingImages.includes(url));
    for (const url of removedUrls) {
      const path = getStoragePath(url);
      if (path) await supabase.storage.from("post-images").remove([path]);
    }

    // Upload new images
    const newUrls: string[] = [];
    for (let i = 0; i < newImages.length; i++) {
      const file = newImages[i];
      const ext = file.name.split(".").pop() ?? "jpg";
      const path = `${user.id}/${Date.now()}_${i}.${ext}`;
      const { error } = await supabase.storage.from("post-images").upload(path, file);
      if (!error) {
        const { data: urlData } = supabase.storage.from("post-images").getPublicUrl(path);
        newUrls.push(urlData.publicUrl);
      }
    }

    const finalImages = [...existingImages, ...newUrls];

    type UpdateData = {
      board_type: string;
      title: string;
      content: string;
      test_name: string | null;
      updated_at: string;
      images: string[];
      post_password?: string;
    };

    const updateData: UpdateData = {
      board_type: boardType,
      title: title.trim(),
      content: content.trim(),
      test_name: boardType === "후기" ? testName : null,
      updated_at: new Date().toISOString(),
      images: finalImages,
    };

    if (!isAdmin && newPassword.length >= 4) {
      updateData.post_password = hashPassword(newPassword);
    }

    const { error } = await supabase.from("posts").update(updateData).eq("id", id);
    if (error) {
      alert("수정에 실패했습니다.");
      setSubmitting(false);
      return;
    }
    router.push(`/community/${id}`);
  }

  if (loading || pageLoading) return null;

  // Password verification screen
  if (!verified) {
    return (
      <div className={styles.formPage}>
        <header className={styles.header}>
          <button className={styles.backBtn} onClick={() => router.push(`/community/${id}`)}>← 돌아가기</button>
          <h1 className={styles.headerTitle}>글 수정</h1>
          <div style={{ width: 60 }} />
        </header>
        <div className={styles.modalCentered}>
          <div className={styles.modalBox}>
            <h2 className={styles.modalTitle}>비밀번호 확인</h2>
            <p className={styles.modalDesc}>게시물 비밀번호를 입력해주세요.</p>
            <input
              type="password"
              className={`${styles.modalInput} ${pwError ? styles.modalInputError : ""}`}
              placeholder="비밀번호"
              value={pwInput}
              onChange={(e) => { setPwInput(e.target.value); setPwError(false); }}
              onKeyDown={(e) => { if (e.key === "Enter") handlePasswordVerify(); }}
              autoFocus
            />
            {pwError && <span className={styles.modalErrorText}>비밀번호가 틀렸습니다.</span>}
            <div className={styles.modalActions}>
              <button className={styles.cancelBtn} onClick={() => router.push(`/community/${id}`)}>취소</button>
              <button className={styles.submitBtn} onClick={handlePasswordVerify} disabled={!pwInput}>확인</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const boardOptions: BoardType[] = isAdmin ? ["자유게시판", "공지", "후기"] : ["자유게시판", "후기"];
  const isReview = boardType === "후기";
  const totalImages = existingImages.length + newImages.length;
  const pwMismatch = newPassword.length > 0 && newPasswordConfirm.length > 0 && newPassword !== newPasswordConfirm;
  const canSubmit =
    !!title.trim() &&
    !!content.trim() &&
    !submitting &&
    (!isReview || !!testName) &&
    !(newPassword.length > 0 && newPassword.length < 4) &&
    !pwMismatch;

  return (
    <div className={styles.formPage}>
      <header className={styles.header}>
        <button className={styles.backBtn} onClick={() => router.push(`/community/${id}`)}>← 돌아가기</button>
        <h1 className={styles.headerTitle}>글 수정</h1>
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
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              maxLength={100}
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>내용</label>
            <textarea
              className={styles.formTextarea}
              value={content}
              onChange={(e) => setContent(e.target.value)}
            />
          </div>

          <div className={styles.formField}>
            <label className={styles.formLabel}>이미지 ({totalImages}/{MAX_IMAGES})</label>
            <div className={styles.imageUploadArea}>
              {existingImages.map((url, i) => (
                <div key={`ex-${i}`} className={styles.imagePreviewItem}>
                  <img src={url} className={styles.imagePreview} alt="" />
                  <button type="button" className={styles.imageRemoveBtn} onClick={() => handleExistingImageRemove(i)}>×</button>
                </div>
              ))}
              {newImagePreviews.map((src, i) => (
                <div key={`new-${i}`} className={styles.imagePreviewItem}>
                  <img src={src} className={styles.imagePreview} alt="" />
                  <button type="button" className={styles.imageRemoveBtn} onClick={() => handleNewImageRemove(i)}>×</button>
                </div>
              ))}
              {totalImages < MAX_IMAGES && (
                <button type="button" className={styles.imageAddBtn} onClick={() => fileInputRef.current?.click()}>
                  <span>+</span>
                  <span>이미지 추가</span>
                </button>
              )}
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" multiple style={{ display: "none" }} onChange={handleNewImageAdd} />
          </div>

          {!isAdmin && storedPasswordHash && (
            <div className={styles.formField}>
              <label className={styles.formLabel}>
                비밀번호 변경 <span className={styles.fieldNote}>(변경하지 않으려면 빈칸)</span>
              </label>
              <div className={styles.passwordRow}>
                <input
                  type="password"
                  className={styles.formInput}
                  placeholder="새 비밀번호 (4자리 이상)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  maxLength={30}
                />
                <input
                  type="password"
                  className={`${styles.formInput} ${pwMismatch ? styles.formInputError : ""}`}
                  placeholder="새 비밀번호 확인"
                  value={newPasswordConfirm}
                  onChange={(e) => setNewPasswordConfirm(e.target.value)}
                  maxLength={30}
                />
              </div>
              {pwMismatch && <span className={styles.fieldError}>비밀번호가 일치하지 않습니다.</span>}
            </div>
          )}

          <div className={styles.formActions}>
            <button className={styles.cancelBtn} onClick={() => router.push(`/community/${id}`)}>취소</button>
            <button className={styles.submitBtn} onClick={handleSubmit} disabled={!canSubmit}>
              {submitting ? "수정 중..." : "수정 완료"}
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
