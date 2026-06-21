"use client";

import { useEffect, useState, RefObject } from "react";
import { useTranslation } from "@/hooks/useTranslation";
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
      Share: { sendDefault: (config: object) => void };
    };
  }
}

export default function ShareResultButtons({ resultRef, title, description }: Props) {
  const { t } = useTranslation();
  const [toast, setToast] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);

  useEffect(() => {
    const tryInit = () => {
      if (typeof window === "undefined") return;
      const key = process.env.NEXT_PUBLIC_KAKAO_APP_KEY;
      if (!key) return;
      if (window.Kakao && !window.Kakao.isInitialized()) window.Kakao.init(key);
    };
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
        scale: 2, useCORS: true, backgroundColor: "#ffffff", logging: false,
      });
      return canvas;
    } catch {
      showToast(t.share.captureError);
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
      showToast(t.share.noSdkError);
      return;
    }
    window.Kakao.Share.sendDefault({
      objectType: "feed",
      content: {
        title,
        description,
        link: { mobileWebUrl: window.location.href, webUrl: window.location.href },
      },
      buttons: [
        { title: "나도 테스트하기", link: { mobileWebUrl: window.location.href, webUrl: window.location.href } },
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
      downloadCanvas(canvas);
      showToast(t.share.instaToast);
    }, "image/png");
  };

  const handleSaveImage = async () => {
    const canvas = await captureImage();
    if (!canvas) return;
    downloadCanvas(canvas);
    showToast("✓");
  };

  return (
    <>
      <div className={styles.shareRow}>
        <button className={styles.kakaoBtn} onClick={handleKakao} disabled={isCapturing}>
          {t.share.kakao}
        </button>
        <button className={styles.instaBtn} onClick={handleInstagram} disabled={isCapturing}>
          {t.share.instagram}
        </button>
        <button className={styles.saveBtn} onClick={handleSaveImage} disabled={isCapturing}>
          {isCapturing ? t.share.saving : t.share.save}
        </button>
      </div>
      {toast && <div className={styles.toast}>{toast}</div>}
    </>
  );
}
