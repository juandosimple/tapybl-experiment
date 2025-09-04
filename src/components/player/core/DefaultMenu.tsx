import React from "react";
import styles from "./DefaultMenu.module.css";

export default function DefaultMenu({
  menu,
  onSelect,
}: {
  menu: { title: string; options: Array<{ targetId: string; label: string }> };
  onSelect: (id: string) => void;
}) {
  return (
    <div className={styles["default-menu"]}>
      <div className={styles["default-menu__container"]}>
        <h3 className={styles["default-menu__title"]}>{menu.title}</h3>
        <div className={styles["default-menu__options-container"]}>
          {menu.options.map((opt) => (
            <button
              key={opt.targetId}
              className={styles["default-menu__button"]}
              onClick={() => onSelect(opt.targetId)}
            >
              <span className={styles["default-menu__button-label"]}>
                {opt.label}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
