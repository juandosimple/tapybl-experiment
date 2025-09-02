import { FormEvent, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../useAuth";

export default function RegisterPage() {
  const { register } = useAuth();
  const nav = useNavigate();

  const [username, setUsername] = useState("");
  const [password1, setPassword1] = useState("");
  const [password2, setPassword2] = useState("");
  const [err, setErr] = useState("");

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setErr("");
    if (!username.trim() || !password1.trim()) {
      setErr("Username and password are required");
      return;
    }
    if (password1 !== password2) {
      setErr("Passwords do not match");
      return;
    }
    const ok = await register(username.trim(), password1);
    if (ok) nav("/", { replace: true });
    else setErr("Could not register");
  }

  return (
    <div className="p-4" style={{ maxWidth: 420, margin: "0 auto" }}>
      <h1 className="mb-3">Create account</h1>

      <form onSubmit={onSubmit} className="d-flex flex-column gap-3">
        <input
          className="form-control bg-dark text-white"
          placeholder="Username"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          autoFocus
        />
        <input
          type="password"
          className="form-control bg-dark text-white"
          placeholder="Password"
          value={password1}
          onChange={(e) => setPassword1(e.target.value)}
        />
        <input
          type="password"
          className="form-control bg-dark text-white"
          placeholder="Repeat password"
          value={password2}
          onChange={(e) => setPassword2(e.target.value)}
        />

        <button type="submit" className="btn btn-light">Register</button>

        {err && <div className="text-danger small">{err}</div>}
      </form>

      <div className="mt-3 small">
        Already have an account? <Link to="/login">Login</Link>
      </div>
    </div>
  );
}