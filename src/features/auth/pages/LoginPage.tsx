import { FormEvent, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../useAuth";

export default function LoginPage() {
  const { login } = useAuth();
  const nav = useNavigate();
  const loc = useLocation() as any;

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    setLoading(true);
    const ok = await login(email.trim(), password);
    setLoading(false);
    if (ok) {
      const backTo = loc.state?.from?.pathname || "/";
      nav(backTo, { replace: true });
    } else {
      setErr("Email o contraseña inválidos");
    }
  }

  return (
    <div className="p-4" style={{ maxWidth: 420, margin: "0 auto" }}>
      <h1 className="mb-3">Login</h1>
      <form onSubmit={onSubmit} className="d-flex flex-column gap-3">
        <input
          className="form-control bg-dark text-white"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          autoFocus
        />
        <input
          type="password"
          className="form-control bg-dark text-white"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />
        <button type="submit" className="btn btn-light" disabled={loading}>
          {loading ? "Entrando..." : "Login"}
        </button>
        {err && <div className="text-danger small">{err}</div>}
      </form>

      <div className="mt-3 small">
        ¿No tienes cuenta? <Link to="/register">Crear una</Link>
      </div>
    </div>
  );
}