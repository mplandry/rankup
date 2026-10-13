// Shared rules for who gets full access vs. the free daily allowance.
// Used by /api/sessions (Study + Exam) and the flashcard session page so
// every mode enforces the trial the same way.

export interface AccessProfile {
  role?: string | null;
  subscription_status?: string | null;
  trial_ends_at?: string | null;
  trial_extended_days?: number | null;
}

// Admins and active subscribers always have full access. Otherwise full
// access requires being inside the trial window (including bonus days).
// No trial date on record = don't lock the user out unexpectedly.
export function hasFullAccess(profile: AccessProfile | null | undefined): boolean {
  if (profile?.role === "admin" || profile?.subscription_status === "active") return true;
  if (!profile?.trial_ends_at) return true;
  const trialEndsAt = new Date(profile.trial_ends_at);
  trialEndsAt.setDate(trialEndsAt.getDate() + (profile.trial_extended_days || 0));
  return new Date() < trialEndsAt;
}

const TZ = "America/New_York";

// Midnight today in Eastern time, as a real Date. The server runs in UTC,
// so a plain setHours(0) would reset the free allowance at 8pm Eastern.
export function startOfTodayEastern(): Date {
  const now = new Date();
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: TZ,
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).formatToParts(now);
  const get = (t: string) => Number(parts.find((p) => p.type === t)?.value || 0);
  const hour = get("hour") % 24;
  const secondsSinceMidnight = hour * 3600 + get("minute") * 60 + get("second");
  return new Date(now.getTime() - secondsSinceMidnight * 1000 - now.getMilliseconds());
}

// Today's date in Eastern time as YYYY-MM-DD.
export function todayKeyEastern(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(new Date());
}
