import { useRef, useEffect, useState } from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import "swiper/css";
import SwiperCore from "swiper";
import { Microlesson } from "@/services/microlessons/types";
import { useLessonGraphLoader } from "@/components/player/adapters/useLessonGraphLoader";
import InteractiveVideoPlayer from "@/components/player/core/InteractiveVideoPlayer";
import Loader from "@/components/loaders";

SwiperCore.use([]);

type Props = {
  lessons: Microlesson[];
  initialLessonId: string;
  organizationId: string;
  onClose: () => void;
};

export default function VideoSwiper({
  lessons,
  initialLessonId,
  organizationId,
  onClose,
}: Props) {
  const initialIndex = lessons.findIndex((l) => l.id === initialLessonId);
  const swiperRef = useRef<any>(null);
  const safeIndex = initialIndex >= 0 ? initialIndex : 0;
  const [resetToken, setResetToken] = useState(0);
  const [activeIndex, setActiveIndex] = useState(safeIndex);
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

          document.querySelectorAll("video").forEach((videoEl) => {
            videoEl.pause();
            videoEl.currentTime = 0;
            videoEl.muted = true;
          });

          const videoInActiveSlide =
            swiper.slides[newIndex]?.querySelector("video");
          if (videoInActiveSlide) {
            videoInActiveSlide.muted = false;
            videoInActiveSlide.currentTime = 0;
            videoInActiveSlide.play().catch(() => {});
          }
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
            {index === activeIndex && (
              <LessonSlide
                key={lesson.id}
                lessonId={lesson.id}
                organizationId={organizationId}
                onClose={onClose}
                resetToken={resetToken}
              />
            )}
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
}

function LessonSlide({
  lessonId,
  organizationId,
  onClose,
  resetToken,
}: {
  lessonId: string;
  organizationId: string;
  onClose: () => void;
  resetToken: number;
}) {
  const { graph, loading, error } = useLessonGraphLoader({
    organizationId,
    lessonId,
  });

  if (loading) return <Loader color="white" />;
  if (error) return <div style={{ padding: 16, color: "salmon" }}>{error}</div>;
  if (!graph) return null;

  return (
    <InteractiveVideoPlayer
      key={`${lessonId}-${resetToken}`}
      graph={graph}
      onClose={onClose}
    />
  );
}
