import { useAuth } from "../../auth/useAuth";
import { useNavigate } from "react-router-dom";
import styles from "./ProfilePage.module.css";
import OrganizationAvatar from "@/components/avatar/OrganizationAvatar";
import profilethumb from "@/assets/images/mock/profile.jpg"; // o .jpg

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
      <div style={{ padding: 16 }}>
        <div style={{ marginBottom: 24, color: "#000" }}>
          <img src={profilethumb} alt=""  className={styles["profile-image"]}/>
          <span
            style={{
              fontWeight: "bold",
              fontSize: 18,
              textAlign: "center",
              display: "block",
            }}
          >
            Mike jones
          </span>
        </div>
        <div className={styles["profile_desc_grid"]}>
          <p>
            2 <span>Courses completed</span>
          </p>
          <p>
            11 <span>Lessons completed</span>
          </p>
          <p>
            43 <span>Challenges completed</span>
          </p>
        </div>
      </div>
      {user ? (
        <div className={styles["profile-page__debug"]}>
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
