import React from "react";

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
      style={{
        width: "100%",
        height: "auto",
        background: "#000",
        borderRadius: 12,
        display: "block",
      }}
    />
  );
}
