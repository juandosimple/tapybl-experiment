import type { Microlesson } from "../types";
import { PlayCircleIcon, PlayIcon } from "@heroicons/react/24/outline";

export default function MicroLessonCard({
  item,
  onOpen,
}: {
  item: Microlesson;
  onOpen: (id: string) => void;
}) {
  const created = new Date(item.dateCreated);
  return (
    <article
      style={{
        marginBottom: "2rem",
        position: "relative",
      }}
    >
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
          position: "absolute",
          zIndex: 1,
          borderRadius: "30px",
          background: "rgba(36,51,77,.60)",
          top: "10px",
          left: "10px",
          backdropFilter: "blur(5px)",
        }}
      >
        <div style={{ overflow: "hidden" }}>
          <div
            style={{
              fontWeight: 400,
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              overflow: "hidden",
              fontSize: ".9rem",
              color: "#fff",
            }}
          >
            {item.title || "(No title)"}
          </div>
          <div style={{ fontSize: 12, color: "#fff" }}>
            {/* {item.statusString} · {created.toLocaleString()} */}
          </div>
        </div>
      </header>

      <button
        onClick={() => onOpen(item.id)} // 👈 ahora usamos id
        style={{
          all: "unset",
          cursor: "pointer",
          display: "block",
          width: "100%",
        }}
        aria-label="Abrir video"
      >
        <div
          style={{
            position: "relative",
            aspectRatio: "1 / 1",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {item.poster ? (
            <>
              <PlayIcon
                style={{
                  position: "absolute",
                  zIndex: 9,
                  fill: "rgba(36, 51, 77, 1)",
                  color: "rgba(36, 51, 77, 1)",
                  width: "32px",
                  strokeWidth: 1,
                  background: "rgba(184,239,54,.6)",
                  borderRadius: "50%",
                  outline: "15px solid rgba(184, 239, 54, 0.6)",
                }}
              />
              <img
                src={item.poster}
                alt=""
                style={{
                  width: "100%",
                  height: "100%",
                  objectFit: "cover",
                  display: "block",
                  borderRadius: 10,
                }}
              />
            </>
          ) : (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                color: "#555",
                fontSize: 14,
                border: "1px solid #ccc",
                background: "rgba(36, 51, 77, 0.2)",
                borderRadius: "20px",
              }}
            >
              <PlayIcon
                style={{
                  position: "absolute",
                  zIndex: 9,
                  fill: "rgba(36, 51, 77, 1)",
                  color: "rgba(36, 51, 77, 1)",
                  width: "32px",
                  strokeWidth: 1.2,
                  background: "rgba(184,239,54,.6)",
                  borderRadius: "50%",
                  outline: "15px solid rgba(184, 239, 54, 0.6)",
                }}
              />
              <p style={{ fontSize: "1.5rem", color: "rgba(0,0,0,.2)" }}>
                (No poster)
              </p>
            </div>
          )}
        </div>
      </button>

      {/* {item.description && (
        <div style={{ padding: "8px 12px", fontSize: 14, color: "#ddd" }}>
          {item.description}
        </div>
      )} */}
    </article>
  );
}
