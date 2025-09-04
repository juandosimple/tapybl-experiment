import type { Microlesson } from "@/services/microlessons/types";
import { PlayIcon } from "@heroicons/react/24/outline";
import styles from "./MicroLessonCard.module.css";
import OrganizationAvatar from "@/components/avatar/OrganizationAvatar";

export default function MicroLessonCard({
  item,
  onOpen,
}: {
  item: Microlesson;
  onOpen: (id: string) => void;
}) {
  const created = new Date(item.dateCreated);
  return (
    <article className={styles["micro-lesson-card"]}>
      <header className={styles["micro-lesson-card__header"]}>
        <OrganizationAvatar
          size={28}
          showName={false}
          className={styles["micro-lesson-card__org"]}
        />
        <div className={styles["micro-lesson-card__title"]}>
          {item.title || "(No title)"}
          {/* Not used for now
          <div style={{ fontSize: 12, color: "#fff" }}>
           {item.statusString} · {created.toLocaleString()}
          </div>
           */}
        </div>
      </header>

      <button
        onClick={() => onOpen(item.id)}
        className={styles["micro-lesson-card__button"]}
        aria-label="Abrir video"
      >
        <div className={styles["micro-lesson-card__media"]}>
          {item.poster ? (
            <>
              <PlayIcon className={styles["micro-lesson-card__play-icon"]} />
              <img
                src={item.poster}
                alt=""
                className={styles["micro-lesson-card__poster"]}
              />
            </>
          ) : (
            <div className={styles["micro-lesson-card__no-poster"]}>
              <PlayIcon className={styles["micro-lesson-card__play-icon"]} />
              <p className={styles["micro-lesson-card__no-poster-text"]}>
                (No poster)
              </p>
            </div>
          )}
        </div>
      </button>

      {/* Not used for now
      {item.description && (
        <div style={{ padding: "8px 12px", fontSize: 14, color: "#ddd" }}>
          {item.description}
        </div>
      )}
       */}
    </article>
  );
}
