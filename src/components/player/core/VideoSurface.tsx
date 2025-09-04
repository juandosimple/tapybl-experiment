import React from "react";
import styles from "./VideoSurface.module.css";

export default function VideoSurface({
  src,
  poster,
  videoRef,
}: {
  src: string;
  poster?: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
}) {
  return (
    <video
      ref={videoRef}
      src={src}
      poster={poster}
      controls={false}
      autoPlay
      playsInline
      className={styles["video-player__source"]}
    />
  );
}
