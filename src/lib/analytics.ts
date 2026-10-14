// Thin wrapper around Google Analytics (gtag) + Microsoft Clarity, both
// loaded in src/app/layout.tsx. Every call is best-effort: analytics must
// never throw or block the app.
//
// PRIVACY: only send IDs and enum-style values (role, plan). Never names,
// emails, or answers.

type AnalyticsWindow = Window & {
  gtag?: (...args: unknown[]) => void;
  clarity?: (...args: unknown[]) => void;
};

const getWin = (): AnalyticsWindow | null =>
  typeof window === "undefined" ? null : (window as AnalyticsWindow);

let identifiedAs: string | null = null;

/**
 * Tag the signed-in user so Clarity / GA can be filtered by role. The admin
 * account is flagged as internal and persisted so the marketing pages tag
 * the next visit too (layout.tsx reads it). The flag clears when a student
 * signs in on the same device.
 */
export function identifyUser({ userId, role }: { userId: string | null; role: string }) {
  try {
    const win = getWin();
    if (!win || !userId) return;
    const key = `${userId}|${role}`;
    if (identifiedAs === key) return;
    identifiedAs = key;

    const isAdmin = role === "admin";
    try {
      if (isAdmin) localStorage.setItem("rankup_internal", "1");
      else localStorage.removeItem("rankup_internal");
    } catch {
      /* ignore */
    }

    if (win.clarity) {
      win.clarity("identify", userId);
      win.clarity("set", "role", role);
      if (isAdmin) win.clarity("set", "platform_admin", "yes");
    }
    if (win.gtag) {
      win.gtag("set", { user_id: userId });
      win.gtag("set", "user_properties", { role });
      if (isAdmin) win.gtag("set", { traffic_type: "internal" });
    }
  } catch {
    /* never block the app on analytics */
  }
}

/** Record a named action, e.g. track("exam_started"). */
export function track(eventName: string, params: Record<string, string | number> = {}) {
  try {
    const win = getWin();
    if (!win || !eventName) return;
    if (win.clarity) win.clarity("event", eventName);
    if (win.gtag) win.gtag("event", eventName, params);
  } catch {
    /* never block the app on analytics */
  }
}
