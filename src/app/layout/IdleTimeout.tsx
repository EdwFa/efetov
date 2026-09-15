import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/features/auth/useAuth";
import { IDLE_TIMEOUT_MS } from "@/shared/config/brand";
import { useToast } from "@/shared/ui/toast";

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];

export function IdleTimeout() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const timer = useRef<number | null>(null);

  useEffect(() => {
    if (!user) return;

    const expire = () => {
      logout("idle");
      navigate("/login", { replace: true });
      showToast("Сессия завершена из-за неактивности (15 минут).");
    };

    const arm = () => {
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(expire, IDLE_TIMEOUT_MS);
    };

    arm();
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, arm));
    return () => {
      if (timer.current) window.clearTimeout(timer.current);
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, arm));
    };
  }, [user, logout, navigate, showToast]);

  return null;
}
