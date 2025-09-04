import { useAuth } from "../../auth/useAuth";
import { useNavigate } from "react-router-dom";
import styles from "./ProfilePage.module.css";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  console.log("user", user);
  function handleLogout() {
    logout();
    nav("/login", { replace: true });
  }

  return (
    <div className={styles["profile-page"]}>
      <h1 className={styles["profile-page__title"]}>Profile</h1>
      {user ? (
        <div className={styles["profile-page__debug"]}>
          <p className={styles["profile-page__info"]}>DEBUG</p>
          <p className={styles["profile-page__info"]}>
            ID: {user.userIdentityId}
          </p>
          <button
            onClick={handleLogout}
            className={styles["profile-page__logout-button"]}
          >
            Logout
          </button>
        </div>
      ) : (
        <p className={styles["profile-page__message"]}>You are not logged in</p>
      )}
    </div>
  );
}
