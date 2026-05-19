
-- Create atomic function to increment profile totals (prevents race conditions)
CREATE OR REPLACE FUNCTION public.increment_profile_totals(
  _user_id uuid,
  _coins integer,
  _carbon integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE profiles
  SET 
    total_coins = total_coins + _coins,
    total_carbon_saved = total_carbon_saved + _carbon,
    updated_at = now()
  WHERE user_id = _user_id;
END;
$$;

-- Sync existing data: recalculate total_carbon_saved from mining_records
-- and total_coins from mining_records minus spend transactions
UPDATE profiles p
SET 
  total_carbon_saved = COALESCE((
    SELECT SUM(mr.carbon_saved) FROM mining_records mr WHERE mr.user_id = p.user_id
  ), 0),
  total_coins = COALESCE((
    SELECT SUM(mr.coins_earned) FROM mining_records mr WHERE mr.user_id = p.user_id
  ), 0) - COALESCE((
    SELECT SUM(t.amount) FROM transactions t WHERE t.user_id = p.user_id AND t.type = 'spend' AND t.status = 'approved'
  ), 0),
  updated_at = now();
