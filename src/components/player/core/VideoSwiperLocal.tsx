// src/components/player/core/VideoSwiper.tsx
import { useRef, useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import SwiperCore from "swiper";
import type { Microlesson } from "@/services/microlessons/types";
// Ya no usamos el graph loader ni el player interactivo en esta versión local
// import { useLessonGraphLoader } from "@/components/player/adapters/useLessonGraphLoader";
// import InteractiveVideoPlayer from "@/components/player/core/InteractiveVideoPlayer";
import Loader from "@/components/loaders";

SwiperCore.use([]);

type LocalLesson = Microlesson & {
  /** Opcional: si viene, se usa; si no, se arma con `/videos/${id}` */
  src?: string;
};

type Props = {
  lessons: LocalLesson[];
  initialLessonId: string;
  organizationId: string; // se mantiene por compat, no se usa en local
  onClose: () => void;
};

export default function VideoSwiper({
  lessons,
  initialLessonId,
  organizationId, // eslint-disable-line @typescript-eslint/no-unused-vars
  onClose,
}: Props) {
  const initialIndex = lessons.findIndex((l) => l.id === initialLessonId);
  const swiperRef = useRef<any>(null);
  const safeIndex = initialIndex >= 0 ? initialIndex : 0;
  const [activeIndex, setActiveIndex] = useState(safeIndex);

  // reproducir el video del slide activo (y pausar el resto)
  const playOnlyActiveSlide = (index: number) => {
    // pausa y resetea todos
    document.querySelectorAll("video").forEach((videoEl) => {
      try {
        videoEl.pause();
        videoEl.currentTime = 0;
        // para permitir autoplay en iOS, dejar muted por defecto;
        // luego desmuteamos el activo cuando el usuario ya interactuó
        videoEl.muted = true;
      } catch {}
    });

    // reproduce el del slide activo
    const activeVideo = swiperRef.current?.slides?.[index]?.querySelector("video") as
      | HTMLVideoElement
      | undefined;

    if (activeVideo) {
      try {
        activeVideo.muted = false; // si querés dejarlo siempre muted, poné true
        activeVideo.currentTime = 0;
        activeVideo.play().catch(() => {
          // algunos navegadores bloquean autoplay no silenciado;
          // si falla, lo dejamos muted y reintenta
          activeVideo.muted = true;
          activeVideo.play().catch(() => {});
        });
      } catch {}
    }
  };

  useEffect(() => {
    // al montar, intentamos reproducir el inicial
    const t = setTimeout(() => playOnlyActiveSlide(safeIndex), 0);
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
      <Swiper
        key={initialLessonId}
        direction="vertical"
        slidesPerView={1}
        initialSlide={safeIndex}
        onSwiper={(swiper) => {
          swiperRef.current = swiper;
        }}
        onSlideChange={(swiper) => {
          const newIndex = swiper.activeIndex;
          setActiveIndex(newIndex);
          playOnlyActiveSlide(newIndex);
        }}
        style={{ height: "100vh", overflow: "hidden" }}
      >
        {lessons.map((lesson, index) => (
          <SwiperSlide
            key={lesson.id}
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
            }}
          >
            {/* Sólo monta el slide activo para no cargar videos innecesarios */}
            {index === activeIndex ? (
              <LessonSlideLocal key={lesson.id} lesson={lesson} />
            ) : (
              // placeholder liviano mientras no está activo
              <div
                style={{
                  width: "100%",
                  height: "100%",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  background: "#000",
                }}
              >
                <Loader color="white" />
              </div>
            )}
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Botón cerrar opcional */}
      <button
        onClick={() => {
          // pausa cualquier video antes de cerrar
          document.querySelectorAll("video").forEach((v) => {
            try {
              v.pause();
            } catch {}
          });
          onClose();
        }}
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 1010,
          background: "rgba(255,255,255,0.9)",
          border: 0,
          padding: "8px 12px",
          borderRadius: 8,
          cursor: "pointer",
          fontWeight: 600,
        }}
      >
        Close
      </button>
    </div>
  );
}

function LessonSlideLocal({ lesson }: { lesson: LocalLesson }) {
  // arma el src local a partir del id si no vino predefinido
  const src = lesson.src ?? `/videos/${lesson.id}`;

  return (
    <video
      key={lesson.id}
      src={src}
      poster={lesson.poster}
      // si querés sin controles, poné controls={false} y armamos una barra custom
      controls
      playsInline
      preload="metadata"
      style={{
        maxHeight: "92vh",
        maxWidth: "100%",
        width: "auto",
        height: "auto",
        background: "#000",
      }}
      onError={(e) => {
        // pequeño fallback para debug
        console.warn("No se pudo cargar el video:", src, e);
      }}
    />
  );
}