import type { Microlesson } from "../types";
import { PlayCircleIcon } from "@heroicons/react/24/outline";

export default function MicroLessonCard({
  item,
  onOpen,
}: {
  item: Microlesson;
  onOpen: (id: string) => void;
}) {
  const created = new Date(item.dateCreated);
  return (
    <article style={{ borderBottom: "8px solid #000" }}>
      <header
        style={{
          display: "flex",
          alignItems: "center",
          gap: 8,
          padding: "8px 12px",
        }}
      >
        <PlayCircleIcon className="icon" />
        <div style={{ overflow: "hidden" }}>
          <div
            style={{
              fontWeight: 600,
              whiteSpace: "nowrap",
              textOverflow: "ellipsis",
              overflow: "hidden",
            }}
          >
            {item.title || "(sin título)"}
          </div>
          <div style={{ fontSize: 12, color: "#aaa" }}>
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
            background: "#111",
          }}
        >
          {item.poster ? (
            <img
              src={item.poster}
              alt=""
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                display: "block",
              }}
            />
          ) : (
            <div
              style={{
                position: "absolute",
                inset: 0,
                display: "grid",
                placeItems: "center",
                color: "#555",
                fontSize: 14,
              }}
            >
              (No poster)
            </div>
          )}
        </div>
      </button>

      {item.description && (
        <div style={{ padding: "8px 12px", fontSize: 14, color: "#ddd" }}>
          {item.description}
        </div>
      )}
    </article>
  );
}
