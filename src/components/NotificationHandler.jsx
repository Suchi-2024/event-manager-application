import { useEffect } from "react";

// Schedules browser notifications ~5 minutes before deadline
export default function NotificationHandler({ tasks }) {
  useEffect(() => {
    if (!("Notification" in window)) return;
    if (
      Notification.permission === "default" ||
      Notification.permission === "denied"
    ) {
      Notification.requestPermission();
    }
    const active = tasks.filter(
      (t) =>
        (t.status === "pending" || t.status === "ongoing") &&
        t.due &&
        new Date(t.due) - Date.now() > 0
    );
    const timers = [];
    for (const t of active) {
      const notifyTime = new Date(t.due) - 5 * 60 * 1000; // 5 minutes before
      const delay = notifyTime - Date.now();
      if (delay > 0) {
        const id = setTimeout(() => {
          new Notification("⏰ Deadline Approaching", {
            body: `Task: "${t.text}" is due soon!`,
          });
        }, delay);
        timers.push(id);
      }
    }
    return () => timers.forEach(clearTimeout);
  }, [tasks]);
  return null;
}
