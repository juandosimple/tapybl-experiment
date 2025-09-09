import { useRef, useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import SwiperCore from "swiper";
import type { Microlesson } from "@/services/microlessons/types";
import Loader from "@/components/loaders";

SwiperCore.use([]);

type LocalLesson = Microlesson & {
  /** si viene, se usa; si no, se arma con `/videos/${id}` */
  src?: string;
  authorName?: string;
  authorAvatar?: string;
};

type Props = {
  lessons: LocalLesson[];
  initialLessonId: string;
  organizationId: string; // lo dejamos por compat (no se usa aquí)
  onClose: () => void;
};

export default function VideoSwiper({
  lessons,
  initialLessonId,
  organizationId, // eslint-disable-line @typescript-eslint/no-unused-vars
  onClose,
}: Props) {
  const initialIndex = Math.max(0, lessons.findIndex((l) => l.id === initialLessonId));
  const swiperRef = useRef<any>(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);

  /** Reproduce solo el video del slide activo (autoplay on swipe) */
  const playOnlyActiveSlide = (index: number) => {
    // pausa todos por las dudas
    document.querySelectorAll("video").forEach((v) => {
      try {
        (v as HTMLVideoElement).pause();
        (v as HTMLVideoElement).currentTime = 0;
      } catch {}
    });

    // reproduce el del slide activo
    const activeVideo = swiperRef.current?.slides?.[index]?.querySelector("video") as
      | HTMLVideoElement
      | undefined;
    if (!activeVideo) return;
    // intentar sin mute; si el navegador bloquea, reintenta muteado
    activeVideo.muted = false;
    activeVideo.currentTime = 0;
    activeVideo.play().catch(() => {
      activeVideo.muted = true;
      activeVideo.play().catch(() => {});
    });
  };

  // autoplay inicial
  useEffect(() => {
    const t = setTimeout(() => playOnlyActiveSlide(initialIndex), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#000",
        zIndex: 1000,
      }}
    >
      {/* back */}
      <button
        onClick={() => {
          document.querySelectorAll("video").forEach((v) => {
            try { (v as HTMLVideoElement).pause(); } catch {}
          });
          onClose();
        }}
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          zIndex: 1010,
          background: "transparent",
          color: "#fff",
          border: 0,
          fontSize: 22,
          cursor: "pointer",
        }}
        aria-label="Back"
      >
        ←
      </button>

      <Swiper
        key={initialLessonId}
        direction="vertical"
        slidesPerView={1}
        initialSlide={initialIndex}
        onSwiper={(s) => (swiperRef.current = s)}
        onSlideChange={(s) => {
          setActiveIndex(s.activeIndex);
          playOnlyActiveSlide(s.activeIndex);
        }}
        style={{ height: "100vh", overflow: "hidden" }}
      >
        {lessons.map((lesson, idx) => (
          <SwiperSlide
            key={lesson.id}
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "24px 0 12px",
              boxSizing: "border-box",
            }}
          >
            {/* Montamos solo el slide activo (mejor perf) */}
            {idx === activeIndex ? (
              <LessonSlideLocal key={lesson.id} lesson={lesson} />
            ) : (
              <div style={{ width: "100%", height: "100%" }}>
                <div
                  style={{
                    width: "92vw",
                    maxWidth: 520,
                    height: 380,
                    margin: "0 auto",
                    borderRadius: 18,
                    background: "#000",
                  }}
                />
              </div>
            )}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

/** Slide con UI tipo Reels: card, info, subtítulo, acciones y progress bar */
function LessonSlideLocal({ lesson }: { lesson: LocalLesson }) {
  const src = lesson.src ?? `/videos/${lesson.id}`;
  const [current, setCurrent] = useState(0);
  const [dur, setDur] = useState(0);
  const [copied, setCopied] = useState(false);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}:${r.toString().padStart(2, "0")}`;
  };
  const progress = dur > 0 ? Math.min(1, current / dur) : 0;

  const handleShare = async () => {
    const shareData = {
      title: lesson.title,
      text: lesson.subtitle || lesson.description || lesson.title,
      url: window.location.href,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      try { await navigator.clipboard.writeText(shareData.url); setCopied(true); setTimeout(() => setCopied(false), 1200); } catch {}
    }
  };

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "grid",
        gridTemplateRows: "1fr auto",
      }}
    >
      {/* STAGE: quito 56.25vw/380 y uso viewport height */}
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          padding: "0 16px",
        }}
      >
        <div
          style={{
            width: "92vw",
            maxWidth: 720,          // si querés más grande, subí este valor
            height: "82vh",         // << ocupa alto
            maxHeight: "82vh",
            borderRadius: 18,
            overflow: "hidden",
            background: "#000",
            boxShadow: "0 6px 26px rgba(0,0,0,.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <video
            ref={videoRef}
            src={src}
            poster={lesson.poster}
            playsInline
            controls={false}
            // ⚠️ ayuda al autoplay en móviles:
            // arranca muteado; el código de autoplay lo desmutea si puede
            muted
            autoPlay
            onTimeUpdate={(e) => setCurrent((e.target as HTMLVideoElement).currentTime)}
            onLoadedMetadata={(e) => setDur((e.target as HTMLVideoElement).duration || 0)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain", // llena alto o ancho según relación
              display: "block",
              background: "#000",
            }}
            onError={(e) => console.warn("Video error:", src, e)}
          />
        </div>
      </div>

      {/* HUD inferior (igual que antes) */}
      <div
        style={{
          position: "relative",
          padding: "16px 20px 20px",
          color: "#fff",
        }}
      >
        <div
          style={{
            position: "absolute",
            right: 20,
            bottom: 64,
            display: "flex",
            flexDirection: "column",
            gap: 12,
          }}
        >
          <button aria-label="Like" style={pillBtnStyle}>♡</button>
          <button aria-label="Share" style={pillBtnStyle} onClick={handleShare}>⤴︎</button>
          {copied && (
            <div
              style={{
                position: "absolute",
                right: 64,
                top: 6,
                padding: "6px 10px",
                borderRadius: 8,
                background: "rgba(0,0,0,.7)",
                fontSize: 12,
                whiteSpace: "nowrap",
              }}
            >
              Copied!
            </div>
          )}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 10 }}>
          <img
            src={lesson.authorAvatar ?? "/logo192.png"}
            alt={lesson.authorName ?? "author"}
            width={28} height={28}
            style={{ borderRadius: "50%", objectFit: "cover" }}
          />
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontWeight: 700 }}>{lesson.authorName ?? "iamproperty"}</div>
            <div style={{ opacity: 0.9 }}>{lesson.title}</div>
            {lesson.subtitle ? (
              <div style={{ opacity: 0.7, fontSize: 12, marginTop: 2 }}>{lesson.subtitle}</div>
            ) : null}
          </div>
        </div>

        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 10,
            fontSize: 12,
            color: "#b9c3c8",
            marginBottom: 6,
          }}
        >
          <span>{fmt(current)}</span>
          <div
            style={{
              flex: 1,
              height: 8,
              borderRadius: 8,
              background: "rgba(255,255,255,.25)",
              overflow: "hidden",
            }}
          >
            <div
              style={{
                width: `${progress * 100}%`,
                height: "100%",
                background: "#9BE22D",
                transition: "width .15s linear",
              }}
            />
          </div>
          <span>{fmt(dur)}</span>
        </div>
      </div>
    </div>
  );
}

const pillBtnStyle: React.CSSProperties = {
  width: 56,
  height: 56,
  borderRadius: 18,
  background: "rgba(5, 42, 52, 0.9)",
  color: "#E7FAFF",
  border: "1px solid rgba(255,255,255,.08)",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  cursor: "pointer",
};