
-- Badges table: defines available badges/achievements
CREATE TABLE public.badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text UNIQUE NOT NULL,
  name text NOT NULL,
  description text NOT NULL,
  icon text NOT NULL DEFAULT '🏅',
  category text NOT NULL DEFAULT 'milestone',
  condition_type text NOT NULL DEFAULT 'mining_count',
  condition_value integer NOT NULL DEFAULT 1,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view badges"
  ON public.badges FOR SELECT
  USING (true);

CREATE POLICY "Teachers can manage badges"
  ON public.badges FOR ALL
  USING (has_role(auth.uid(), 'teacher'::app_role))
  WITH CHECK (has_role(auth.uid(), 'teacher'::app_role));

-- User badges: tracks which badges users have earned
CREATE TABLE public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  earned_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own badges"
  ON public.user_badges FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Anyone authenticated can view badges for display"
  ON public.user_badges FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "System can insert badges"
  ON public.user_badges FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Class missions: teacher-created class-wide challenges
CREATE TABLE public.class_missions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid NOT NULL REFERENCES public.classes(id) ON DELETE CASCADE,
  teacher_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  target_value integer NOT NULL DEFAULT 100,
  current_value integer NOT NULL DEFAULT 0,
  mission_type text NOT NULL DEFAULT 'total_coins',
  reward_description text,
  status text NOT NULL DEFAULT 'active',
  start_date timestamptz NOT NULL DEFAULT now(),
  end_date timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.class_missions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Class members can view missions"
  ON public.class_missions FOR SELECT
  USING (is_class_member(auth.uid(), class_id) OR auth.uid() = teacher_id);

CREATE POLICY "Teachers can manage missions"
  ON public.class_missions FOR ALL
  USING (auth.uid() = teacher_id)
  WITH CHECK (auth.uid() = teacher_id);

-- Trigger for updated_at
CREATE TRIGGER update_class_missions_updated_at
  BEFORE UPDATE ON public.class_missions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Seed default badges
INSERT INTO public.badges (key, name, description, icon, category, condition_type, condition_value) VALUES
  ('first_mining', '첫 채굴!', '처음으로 환경 행동을 채굴했어요', '⛏️', 'milestone', 'mining_count', 1),
  ('mining_10', '꾸준한 실천가', '환경 행동을 10번 채굴했어요', '🌱', 'milestone', 'mining_count', 10),
  ('mining_50', '환경 수호자', '환경 행동을 50번 채굴했어요', '🛡️', 'milestone', 'mining_count', 50),
  ('mining_100', '에코 마스터', '환경 행동을 100번 채굴했어요', '👑', 'milestone', 'mining_count', 100),
  ('coins_100', '100코인 달성', '총 100 Eco-Coin을 모았어요', '💰', 'coins', 'total_coins', 100),
  ('coins_500', '500코인 달성', '총 500 Eco-Coin을 모았어요', '💎', 'coins', 'total_coins', 500),
  ('carbon_1kg', '1kg 탄소 절감', '탄소 1kg을 절감했어요', '🌍', 'carbon', 'total_carbon', 1000),
  ('carbon_5kg', '5kg 탄소 절감', '탄소 5kg을 절감했어요', '🌏', 'carbon', 'total_carbon', 5000),
  ('streak_3', '3일 연속 채굴', '3일 연속으로 채굴했어요', '🔥', 'streak', 'streak_days', 3),
  ('streak_7', '7일 연속 채굴', '7일 연속으로 채굴했어요', '⚡', 'streak', 'streak_days', 7);
