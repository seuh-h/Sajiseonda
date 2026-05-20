"use client";

import { useEffect, useState, RefObject } from "react";
import styles from "./ShareResultButtons.module.css";

interface Props {
  resultRef: RefObject<HTMLElement | null>;
  title: string;
  description: string;
}

declare global {
  interface Window {
    Kakao: {
      init: (key: string) => void;
      isInitialized: () => boolean;
      Share: {
        sendDefault: (config: object) => void;
      };
    };
  }
}

export default function ShareResultButtons({ resultRef, title, description }: Props) {
  const [toast, setToast] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    const tryInit = () => {
      if (typeof window === "undefined") return;
      const key = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
      if (!key) return;
      if (window.Kakao && !window.Kakao.isInitialized()) {
        window.Kakao.init(key);
      }
    };

    // SDK may not be loaded yet — retry once after a short delay
    tryInit();
    const timer = setTimeout(tryInit, 1500);
    return () => clearTimeout(timer);
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const captureImage = async (): Promise<HTMLCanvasElement | null> => {
    if (!resultRef.current) return null;
    setIsCapturing(true);
    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(resultRef.current, {
        scale: 2,
        useCORS: true,
        backgroundColor: "#ffffff",
        logging: false,
      });
      return canvas;
    } catch {
      showToast("이미지 생성에 실패했어요.");
      return null;
    } finally {
      setIsCapturing(false);
    }
  };

  const downloadCanvas = (canvas: HTMLCanvasElement) => {
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "사지선다_결과.png";
    a.click();
  };

  const handleKakao = () => {
    if (!window.Kakao?.isInitialized()) {
      showToast("카카오 키를 .env에 추가하면 공유할 수 있어요");
      return;
    }
    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title,
        description,
        link: {
          mobileWebUrl: window.location.href,
          webUrl: window.location.href,
        },
      },
      buttons: [
        {
          title: "나도 테스트하기",
          link: {
            mobileWebUrl: window.location.href,
            webUrl: window.location.href,
          },
        },
      ],
    });
  };

  const handleInstagram = async () => {
    const canvas = await captureImage();
    if (!canvas) return;

    canvas.toBlob(async (blob) => {
      if (!blob) return;
      const file = new File([blob], "result.png", { type: "image/png" });

      if (navigator.share && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title });
          return;
        } catch (e) {
          if ((e as Error).name === "AbortError") return;
        }
      }
      // Fallback: 이미지 다운로드 후 안내
      downloadCanvas(canvas);
      showToast("이미지 저장됨! 인스타그램 앱에서 공유하세요 📸");
    }, "image/png");
  };

  const handleSaveImage = async () => {
    const canvas = await captureImage();
    if (!canvas) return;
    downloadCanvas(canvas);
    showToast("이미지가 저장됐어요! ✓");
  };

  return (
    <>
      <div className={styles.shareRow}>
        <button className={styles.kakaoBtn} onClick={handleKakao} disabled={isCapturing}>
          💬 카카오톡
        </button>
        <button className={styles.instaBtn} onClick={handleInstagram} disabled={isCapturing}>
          📸 인스타그램
        </button>
        <button className={styles.saveBtn} onClick={handleSaveImage} disabled={isCapturing}>
          {isCapturing ? "저장 중..." : "⬇ 이미지 저장"}
        </button>
      </div>
      {toast && <div className={styles.toast}>{toast}</div>}
    </>
  );
}
