import { FormEvent, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../useAuth";
import styles from "./Login.module.css";
import VideoBg from "../components/VideoBg";
import Button from "react-bootstrap/Button";
import Form from "react-bootstrap/Form";
import logo from "@/assets/images/white_font_logo.svg";

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
      setErr(
        "The password you entered is incorrect. Please try again or reset your password."
      );
    }
  }

  const bgVideos = [
    "/videos/bg1.mp4",
    "/videos/bg2.mp4",
    "/videos/bg3.mp4",
    "/videos/bg4.mp4",
    "/videos/bg5.mp4",
  ];

  return (
    <div className={styles.login}>
      <VideoBg videos={bgVideos} crossfadeMs={700} />

      <div className={styles.login__container}>
        <img
          src={logo}
          alt="Tapybl Micro Reels"
          className={styles.login__logo}
        />
        <Form onSubmit={onSubmit} className={styles.login__form}>
          <Form.Group className={styles.login__group}>
            <Form.Label id="email" className={styles.login__label}>
              Email address
            </Form.Label>
            <Form.Control
              className={styles.login__input}
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoFocus
              name="email"
            />
          </Form.Group>
          <Form.Group className={styles.login__group}>
            <Form.Label id="password" className={styles.login__label}>
              Password
            </Form.Label>
            <Form.Control
              type="password"
              className={styles.login__input}
              placeholder="Password"
              value={password}
              name="password"
              onChange={(e) => setPassword(e.target.value)}
            />
          </Form.Group>
          <Button
            type="submit"
            className={`${styles.login__button} btn`}
            disabled={loading}
          >
            {loading ? "Signing in..." : "Login"}
          </Button>

          {err && <div className={`${styles.login__error}`}>{err}</div>}
        </Form>
      </div>
    </div>
  );
}
