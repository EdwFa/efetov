import { useEffect, useRef, useState } from "react";
import { api } from "@/api/mock";
import { useAuth } from "@/features/auth/useAuth";
import { hasUnsavedChanges } from "@/features/patient/unsaved";
import { IDLE_TIMEOUT_MS, IDLE_WARNING_MS } from "@/shared/config/brand";
import { Button, Card, Modal } from "@/shared/ui";
import { useToast } from "@/shared/ui/toast";

const ACTIVITY_EVENTS = ["mousemove", "mousedown", "keydown", "scroll", "touchstart"];
const TOUCH_INTERVAL_MS = 60_000;

export function IdleTimeout() {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const [warning, setWarning] = useState(false);
  const warningRef = useRef(false);
  const logoutTimer = useRef<number | null>(null);
  const warningTimer = useRef<number | null>(null);
  const lastTouch = useRef(0);
  const stayRef = useRef<() => void>(() => undefined);

  useEffect(() => {
    if (!user) return;

    const clearTimers = () => {
      if (logoutTimer.current) window.clearTimeout(logoutTimer.current);
      if (warningTimer.current) window.clearTimeout(warningTimer.current);
      logoutTimer.current = null;
      warningTimer.current = null;
    };

    const expire = () => {
      const dirty = hasUnsavedChanges();
      warningRef.current = false;
      setWarning(false);
      logout("idle");
      showToast(
        dirty
          ? "Сессия завершена из-за неактивности (15 минут). Несохранённые изменения не записаны."
          : "Сессия завершена из-за неактивности (15 минут)."
      );
    };

    const openWarning = () => {
      if (!hasUnsavedChanges()) return;
      warningRef.current = true;
      setWarning(true);
    };

    const arm = () => {
      if (warningRef.current) return;
      clearTimers();
      const now = Date.now();
      if (now - lastTouch.current >= TOUCH_INTERVAL_MS) {
        lastTouch.current = now;
        void api.touchSession().catch(() => undefined);
      }
      warningTimer.current = window.setTimeout(
        openWarning,
        Math.max(IDLE_TIMEOUT_MS - IDLE_WARNING_MS, 0)
      );
      logoutTimer.current = window.setTimeout(expire, IDLE_TIMEOUT_MS);
    };

    stayRef.current = () => {
      warningRef.current = false;
      setWarning(false);
      lastTouch.current = 0;
      arm();
    };

    warningRef.current = false;
    setWarning(false);
    arm();
    const onActivity = () => arm();
    ACTIVITY_EVENTS.forEach((event) => window.addEventListener(event, onActivity));
    return () => {
      clearTimers();
      ACTIVITY_EVENTS.forEach((event) => window.removeEventListener(event, onActivity));
    };
  }, [user, logout, showToast]);

  if (!warning) return null;

  return (
    <Modal onClose={() => undefined}>
      <Card className="p-6">
        <h2 className="text-xl font-black">Несохранённые изменения</h2>
        <p className="mt-3 text-slate-700">
          Есть несохранённые изменения. Через минуту сессия завершится из-за
          бездействия, и эти изменения не сохранятся.
        </p>
        <div className="mt-5 flex justify-end">
          <Button type="button" onClick={() => stayRef.current()}>
            Продолжить работу
          </Button>
        </div>
      </Card>
    </Modal>
  );
}
