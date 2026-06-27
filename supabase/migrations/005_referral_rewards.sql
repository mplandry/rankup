-- supabase/migrations/005_referral_rewards.sql
-- New paid-subscription referral program: tiered $/$ reward by plan,
-- referrer payout unlocks 30 days after the referred user's payment clears,
-- plus a "bring your crew" multiplier (every 3rd unlocked referral = free month).
--
-- This replaces the trial-day-based `referrals` / `grant_referral_bonus` flow
-- for monetary rewards. The old table is left in place (unused, 0 rows) rather
-- than dropped, in case anything still reads from it.

-- ============================================================
-- REFERRAL REWARDS
-- ============================================================
CREATE TABLE IF NOT EXISTS referral_rewards (
  id                          uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id                 uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  referred_id                 uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  plan_type                   text        NOT NULL CHECK (plan_type IN ('monthly', 'exam_prep')),
  referrer_credit_cents        int        NOT NULL,
  referred_discount_cents      int        NOT NULL,
  status                      text        NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'unlocked', 'applied', 'expired')),
  stripe_checkout_session_id  text,
  referred_payment_cleared_at timestamptz,
  unlocks_at                  timestamptz,
  applied_at                  timestamptz,
  created_at                  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (referred_id) -- one paid-referral reward per referred user
);

CREATE INDEX IF NOT EXISTS idx_referral_rewards_referrer ON referral_rewards (referrer_id);
CREATE INDEX IF NOT EXISTS idx_referral_rewards_unlock_sweep ON referral_rewards (status, unlocks_at);

ALTER TABLE referral_rewards ENABLE ROW LEVEL SECURITY;

-- Users can see rewards where they're either side; all writes go through
-- service-role (webhook + unlock cron), so no INSERT/UPDATE policy is needed.
CREATE POLICY "referral_rewards_read_own" ON referral_rewards FOR SELECT
  USING (auth.uid() = referrer_id OR auth.uid() = referred_id);

-- ============================================================
-- CREW BONUS (every Nth unlocked referral = free month)
-- ============================================================
CREATE TABLE IF NOT EXISTS referral_crew_bonuses (
  id           uuid        PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id  uuid        NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  milestone    int         NOT NULL, -- 3, 6, 9, ...
  credit_cents int         NOT NULL DEFAULT 4000,
  granted_at   timestamptz,
  created_at   timestamptz NOT NULL DEFAULT now(),
  UNIQUE (referrer_id, milestone)
);

ALTER TABLE referral_crew_bonuses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "referral_crew_bonuses_read_own" ON referral_crew_bonuses FOR SELECT
  USING (auth.uid() = referrer_id);
