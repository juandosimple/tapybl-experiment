import React from "react";
import { XMarkIcon } from "@heroicons/react/24/outline";
import styles from "./OverlayRoot.module.css";

export default function OverlayRoot({
  children,
  onClose,
}: {
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className={styles["overlay-root"]} role="dialog" aria-modal="true">
      <div className={styles["overlay-root__topbar"]}>
        <button
          onClick={onClose}
          title="Close"
          className={styles["overlay-root__close-button"]}
        >
          <XMarkIcon className={styles["overlay-root__close-icon"]} />
        </button>
      </div>
      <div className={styles["overlay-root__body"]}>{children}</div>
    </div>
  );
}
