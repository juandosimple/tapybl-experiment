import React from "react";
import { ArrowLeftIcon, XMarkIcon } from "@heroicons/react/24/outline";
import styles from "./OverlayRoot.module.css";
import OrganizationAvatar from "@/components/avatar/OrganizationAvatar";

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
          <ArrowLeftIcon className={styles["overlay-root__close-icon"]} />
        </button>
      </div>
      <div className={styles["overlay-root__body"]}>
        <div className={styles["overlay-root__meta"]}>
          <OrganizationAvatar showName={false} />
          <p>
            <strong>iamproperty</strong> <br /> Distressed clients
          </p>
        </div>

        {children}
      </div>
    </div>
  );
}
