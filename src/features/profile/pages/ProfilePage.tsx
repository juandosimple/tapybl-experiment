import { useAuth } from "../../auth/useAuth";
import { useNavigate } from "react-router-dom";

export default function ProfilePage() {
  const { user, logout } = useAuth();
  const nav = useNavigate();

  function handleLogout() {
    logout();
    nav("/login", { replace: true });
  }

  return (
    <div className="p-3">
      <h1>Perfil</h1>
      {user ? (
        <>
          <p>ID: {user.userIdentityId}</p>
          <p>Email confirmado: {user.emailConfirmed ? "Sí" : "No"}</p>
          <button onClick={handleLogout} className="btn btn-danger mt-3">
            Logout
          </button>
        </>
      ) : (
        <p>No hay usuario logueado</p>
      )}
    </div>
  );
}