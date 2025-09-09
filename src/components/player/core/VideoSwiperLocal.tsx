import { useRef, useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import SwiperCore from "swiper";
import type { Microlesson } from "@/services/microlessons/types";
import {
  ArrowUpOnSquareIcon,
  BookmarkIcon,
  HeartIcon,
} from "@heroicons/react/24/outline";
import logo from "@/assets/images/mock/imaproperty-logo.jpg"; // o .jpg



SwiperCore.use([]);

type LocalLesson = Microlesson & {
  src?: string;
  authorName?: string;
  authorAvatar?: string;
};

// —— QUIZZES por video (clave = id del archivo en /public/videos/)
const QUIZZES: Record<
  string,
  { question: string; options: { text: string; correct: boolean }[] }
> = {
  "dc1-vertical.mp4": {
    question:
      "What is a crucial role property professionals play beyond the financial transaction of buying or selling a home?",
    options: [
      { text: "Providing legal advice on property disputes.", correct: false },
      {
        text: "Offering emotional support and human connection to clients experiencing distress.",
        correct: true,
      },
      {
        text: "Managing the client's finances and investments.",
        correct: false,
      },
      {
        text: "Guaranteeing the property will increase in value.",
        correct: false,
      },
    ],
  },
  "dc2-vertical.mp4": {
    question:
      "When a client expresses thoughts of self-harm, what is the MOST appropriate initial response?",
    options: [
      {
        text: "Immediately offer solutions and advice to alleviate their distress.",
        correct: false,
      },
      {
        text: "Share a personal story of overcoming a similar struggle to show empathy.",
        correct: false,
      },
      {
        text: "Quickly assess the situation and contact emergency services without allowing them to speak.",
        correct: false,
      },
      {
        text: "Stay calm, listen attentively without interruption, and take their feelings seriously.",
        correct: true,
      },
    ],
  },
  "dc3-vertical.mp4": {
    question:
      "A client discloses they are experiencing persistent low mood and difficulty coping. While showing empathy, what is the MOST appropriate next step according to the provided guidelines?",
    options: [
      {
        text: "Offer personal advice based on your own experiences with mood fluctuations.",
        correct: false,
      },
      {
        text: "Attempt to diagnose the cause of their low mood and create a coping strategy together.",
        correct: false,
      },
      {
        text: "Suggest contacting their GP or a mental health organization like Mind or the Samaritans for professional support.",
        correct: true,
      },
      {
        text: "Reassure them that these feelings are normal and will likely pass without intervention.",
        correct: false,
      },
    ],
  },
  "dc4-vertical.mp4": {
    question:
      "What is the MOST important step to take immediately after supporting a distressed client?",
    options: [
      {
        text: "Immediately call another client to stay busy.",
        correct: false,
      },
      {
        text: "Take a short break to process your emotions.",
        correct: true,
      },
      {
        text: "Document the entire interaction in detail.",
        correct: false,
      },
      {
        text: "Ask the distressed client for feedback on your support.",
        correct: false,
      },
    ],
  },
};



type Props = {
  lessons: LocalLesson[];
  initialLessonId: string;
  organizationId: string; // compat
  onClose: () => void;
};

export default function VideoSwiper({
  lessons,
  initialLessonId,
  organizationId, // eslint-disable-line @typescript-eslint/no-unused-vars
  onClose,
}: Props) {
  const initialIndex = Math.max(
    0,
    lessons.findIndex((l) => l.id === initialLessonId)
  );
  const swiperRef = useRef<any>(null);
  const [activeIndex, setActiveIndex] = useState(initialIndex);
  const [resetToken, setResetToken] = useState(0); // 👈 nuevo
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null); // 👈 nuevo

  // --- Swipe horizontal a la derecha -> ir al channel
// --- Swipe horizontal a la izquierda -> ir al channel
const CHANNEL_URL =
  "http://localhost:5173/channel/074ebc4f-a6f1-41b8-ffc1-08ddea1db2c1";

const SWIPE_X_THRESHOLD = 60;  // umbral en px
const SWIPE_X_MAX = 160;       // distancia para completar animación visual
const SWIPE_Y_TOLERANCE = 40;  // tolerancia vertical

const touchStartX = useRef<number | null>(null);
const touchStartY = useRef<number | null>(null);
const touchDX = useRef<number>(0);
const touchDY = useRef<number>(0);

const [hSwipeProgress, setHSwipeProgress] = useState(0);   // 0..1
const [showHSIndicator, setShowHSIndicator] = useState(false);
const [isAnimatingOut, setIsAnimatingOut] = useState(false);

const onTouchStartRoot = (e: React.TouchEvent<HTMLDivElement>) => {
  if (e.touches.length !== 1) return;
  const t = e.touches[0];
  touchStartX.current = t.clientX;
  touchStartY.current = t.clientY;
  touchDX.current = 0;
  touchDY.current = 0;
  setIsAnimatingOut(false);
};

const onTouchMoveRoot = (e: React.TouchEvent<HTMLDivElement>) => {
  if (touchStartX.current == null || touchStartY.current == null) return;
  const t = e.touches[0];
  touchDX.current = t.clientX - touchStartX.current;
  touchDY.current = t.clientY - touchStartY.current;

  const dx = touchDX.current;        // < 0 cuando arrastro a la izquierda
  const dy = Math.abs(touchDY.current);

  // Mostrar overlay si el gesto es horizontal dominante y hacia la IZQUIERDA
  if (dx < 0 && dy < SWIPE_Y_TOLERANCE && Math.abs(dx) > dy * 1.2) {
    setShowHSIndicator(true);
    // progreso de 0..1 usando -dx (positivo)
    const p = Math.min(Math.max((-dx) / SWIPE_X_MAX, 0), 1);
    setHSwipeProgress(p);
  } else {
    setHSwipeProgress(0);
    setShowHSIndicator(false);
  }
};

const onTouchEndRoot = () => {
  const dx = touchDX.current;
  const dy = Math.abs(touchDY.current);
  touchStartX.current = touchStartY.current = null;

  // swipe a la IZQUIERDA supera umbral
  if (-dx > SWIPE_X_THRESHOLD && dy < SWIPE_Y_TOLERANCE) {
    setIsAnimatingOut(true);
    setHSwipeProgress(1);
    setTimeout(() => {
      document.querySelectorAll("video").forEach((v) => {
        try { (v as HTMLVideoElement).pause(); } catch {}
      });
      window.location.href = CHANNEL_URL; // o navigate("/channel/...")
    }, 120);
  } else {
    setIsAnimatingOut(false);
    setHSwipeProgress(0);
    setShowHSIndicator(false);
  }
};

// EXPERIMENTAL

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const playOnlyActiveSlide = (index: number) => {
    document.querySelectorAll("video").forEach((v) => {
      try {
        (v as HTMLVideoElement).pause();
        (v as HTMLVideoElement).currentTime = 0;
      } catch {}
    });

    const activeVideo = swiperRef.current?.slides?.[index]?.querySelector(
      "video"
    ) as HTMLVideoElement | undefined;
    if (!activeVideo) return;

    // intentar sin mute; si falla, reintenta muteado (autoplay mobile)
    activeVideo.muted = false;
    activeVideo.currentTime = 0;
    activeVideo.play().catch(() => {
      activeVideo.muted = true;
      activeVideo.play().catch(() => {});
    });
  };

  useEffect(() => {
    const t = setTimeout(() => playOnlyActiveSlide(initialIndex), 0);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const goNext = () => {
    clearTimer(); // 👈 evita timers colgados
    const s = swiperRef.current as any;
    if (!s) return;
    s.slideNext();
    const nextIndex = Math.min(activeIndex + 1, lessons.length - 1);
    // forzar reset en el nuevo slide
    setResetToken((x) => x + 1); // 👈 hará que el hijo limpie su estado
    setTimeout(() => playOnlyActiveSlide(nextIndex), 50);
  };

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        backgroundColor: "#000",
        zIndex: 1000,
      }}
      onTouchStart={onTouchStartRoot}
      onTouchMove={onTouchMoveRoot}
      onTouchEnd={onTouchEndRoot}
    >

{/* EXPERIMENTAL */}
{showHSIndicator || hSwipeProgress > 0 ? (
  <div
    style={{
      pointerEvents: "none",
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      zIndex: 1005,
      display: "flex",
      alignItems: "center",
      justifyContent: "flex-end",   // 👉 anclado a la derecha
      paddingLeft: 16,
      paddingRight: 16,
    }}
  >
    {/* chip que “entra” desde la derecha hacia el centro */}
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        transform: `translateX(${-Math.round(hSwipeProgress * 40)}px)`, // 👉 mueve hacia la IZQ
        opacity: 0.2 + hSwipeProgress * 0.8,
        transition: isAnimatingOut
          ? "transform 120ms ease, opacity 120ms ease"
          : "transform 180ms ease, opacity 180ms ease",
        background: "rgba(5,42,52,0.88)",
        border: "1px solid rgba(255,255,255,0.12)",
        color: "#E7FAFF",
        borderRadius: 18,
        padding: "10px 14px",
        boxShadow: "0 8px 24px rgba(0,0,0,.4)",
      }}
    >
      {/* Flecha hacia la IZQUIERDA */}
      <span style={{ fontSize: 20, lineHeight: "20px" }}>↞</span>
      <div style={{ fontWeight: 700, fontSize: 14 }}>Go to channel</div>
    </div>

    {/* velito a la derecha */}
    <div
      style={{
        width: 12,
        height: 80,
        marginLeft: 12,
        borderRadius: 12,
        background:
          "linear-gradient(270deg, rgba(5,42,52,0.0) 0%, rgba(5,42,52,0.25) 60%, rgba(5,42,52,0.45) 100%)",
        opacity: hSwipeProgress * 0.8,
        transition: "opacity 180ms ease",
      }}
    />
  </div>
) : null}
{/* EXPERIMENTAL */}

      <button
        onClick={() => {
          document.querySelectorAll("video").forEach((v) => {
            try {
              (v as HTMLVideoElement).pause();
            } catch {}
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
          clearTimer(); // 👈 limpia cualquier espera pendiente
          setActiveIndex(s.activeIndex);
          setResetToken((x) => x + 1); // 👈 resetea estado en el slide activo
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
            {idx === activeIndex ? (
              <LessonSlideLocal
                key={`${lesson.id}-${resetToken}`} // 👈 fuerza remount limpio
                lesson={lesson}
                quiz={QUIZZES[lesson.id]}
                resetToken={resetToken} // 👈 pasa token
                onAnswer={() => {
                  // espera 2s y navega al siguiente
                  clearTimer();
                  timerRef.current = setTimeout(goNext, 2000);
                }}
              />
            ) : (
              <div style={{ width: "100%", height: "100%" }} />
            )}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

/** Slide con video + HUD + modal de quiz a -2s del final */
function LessonSlideLocal({
  lesson,
  quiz,
  resetToken,
  onAnswer,
}: {
  lesson: LocalLesson;
  quiz?: { question: string; options: { text: string; correct: boolean }[] };
  resetToken: number;
  onAnswer: () => void;
}) {
  const src = lesson.src ?? `/videos/${lesson.id}`;
  const [current, setCurrent] = useState(0);
  const [dur, setDur] = useState(0);
  const [showQuiz, setShowQuiz] = useState(false);
  const [selected, setSelected] = useState<number | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  // reset completo al cambiar slide/token
  useEffect(() => {
    setCurrent(0);
    setDur(0);
    setShowQuiz(false);
    setSelected(null);
    if (videoRef.current) videoRef.current.currentTime = 0;
  }, [resetToken, lesson.id]);

  // Mostrar quiz 2s antes de terminar
  useEffect(() => {
    if (!dur) return;
    const remain = dur - current;
    if (!showQuiz && quiz && remain <= 2 && remain >= 0) {
      setShowQuiz(true);
      // si querés pausar cuando aparece el modal:
      // videoRef.current?.pause();
    }
  }, [current, dur, quiz, showQuiz]);

  // Al seleccionar opción
  const handleSelect = (i: number) => {
    if (selected !== null) return;
    setSelected(i);
    setShowQuiz(false); // oculto modal
    onAnswer(); // el padre espera 2s y pasa al siguiente
  };

  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const r = Math.floor(s % 60);
    return `${m}:${r.toString().padStart(2, "0")}`;
  };

  const progress = dur > 0 ? Math.min(1, current / dur) : 0;

  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "grid",
        gridTemplateRows: "1fr auto",
      }}
    >
      {/* STAGE */}
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
            maxWidth: 720,
            // height: "82vh",
            maxHeight: "82vh",
            borderRadius: 18,
            overflow: "hidden",
            background: "#000",
            boxShadow: "0 6px 26px rgba(0,0,0,.45)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            position: "relative",
          }}
        >
          <video
            ref={videoRef}
            src={src}
            poster={lesson.poster}
            playsInline
            controls={false}
            muted
            autoPlay
            onTimeUpdate={(e) =>
              setCurrent((e.target as HTMLVideoElement).currentTime)
            }
            onLoadedMetadata={(e) =>
              setDur((e.target as HTMLVideoElement).duration || 0)
            }
            style={{
              width: "100%",
              height: "100%",
              objectFit: "contain",
              display: "block",
              background: "#000",
            }}
            onError={(e) => console.warn("Video error:", src, e)}
          />

          {/* MODAL QUIZ */}
          {showQuiz && quiz && (
            <div
              style={{
                position: "absolute",
                top: "4%",
                left: "50%",
                transform: "translateX(-50%)",
                width: "min(560px, 90%)",
                background: "rgba(5, 42, 52, 0.92)",
                borderRadius: 24,
                padding: "22px 18px 18px",
                color: "#fff",
                boxShadow: "0 8px 28px rgba(0,0,0,.45)",
                backdropFilter: "blur(2px)",
                zIndex: "999999",
              }}
            >
              <div
                style={{
                  fontSize: 15,
                  margin: "4px 4px 14px 4px",
                  opacity: 0.95,
                }}
              >
                {quiz.question}
              </div>

              <div
                style={{ display: "flex", flexDirection: "column", gap: 12 }}
              >
                {quiz.options.map((opt, i) => {
                  const isSel = selected === i;
                  const bg =
                    selected == null
                      ? "#41FF88"
                      : isSel
                      ? opt.correct
                        ? "#41FF88"
                        : "#FF6B6B"
                      : "#2e7353";
                  return (
                    <button
                      key={i}
                      onClick={() => handleSelect(i)}
                      disabled={selected != null}
                      style={{
                        textAlign: "left",
                        border: 0,
                        padding: "14px 16px",
                        borderRadius: 18,
                        fontWeight: 500,
                        cursor: selected == null ? "pointer" : "default",
                        background: bg,
                        color: selected == null ? "#053428" : "#052A34",
                        opacity: selected == null || isSel ? 1 : 0.6,
                      }}
                    >
                      {opt.text}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* HUD inferior */}
      <div
        style={{
          position: "relative",
          padding: "16px 20px 20px",
          color: "#fff",
        }}
      >
        {/* acciones flotantes derecha */}
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
          <button aria-label="Like" style={pillBtnStyle}>
            <HeartIcon width={22} height={22} />
          </button>
          <button aria-label="Like" style={pillBtnStyle}>
            <BookmarkIcon width={22} height={22} />
          </button>
          <button
            aria-label="Share"
            style={pillBtnStyle}
            onClick={async () => {
              const shareData = {
                title: lesson.title,
                text: lesson.subtitle || lesson.description || lesson.title,
                url: window.location.href,
              };
              if (navigator.share) {
                try {
                  await navigator.share(shareData);
                } catch {}
              } else {
                try {
                  await navigator.clipboard.writeText(shareData.url);
                } catch {}
              }
            }}
          >
            <ArrowUpOnSquareIcon width={22} height={22} />
          </button>
        </div>

        {/* info canal + título + subtítulo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginBottom: 10,
          }}
        >
          <img
            src={logo}
            alt={lesson.authorName ?? "author"}
            width={28}
            height={28}
            style={{ borderRadius: "50%", objectFit: "cover" }}
          />
          <div style={{ lineHeight: 1.1 }}>
            <div style={{ fontWeight: 700 }}>iamproperty</div>
            {/* <div style={{ opacity: 0.9 }}>{lesson.title}</div> */}
            {lesson.subtitle ? (
              <div style={{ opacity: 0.7, fontSize: 12, marginTop: 2 }}>
                {lesson.subtitle}
              </div>
            ) : null}
          </div>
        </div>

        {/* tiempos + barra */}
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
