
-- Create eco_actions table to replace hardcoded actions
CREATE TABLE public.eco_actions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  action_key text NOT NULL UNIQUE,
  name text NOT NULL,
  name_ko text NOT NULL,
  description text NOT NULL,
  carbon_reduction integer NOT NULL DEFAULT 0,
  coin_value integer NOT NULL DEFAULT 0,
  icon text NOT NULL DEFAULT '🌱',
  category text NOT NULL DEFAULT 'recycling',
  daily_limit integer DEFAULT NULL,
  available boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.eco_actions ENABLE ROW LEVEL SECURITY;

-- Everyone can view available actions
CREATE POLICY "Anyone can view eco actions"
ON public.eco_actions
AS PERMISSIVE
FOR SELECT
TO authenticated
USING (true);

-- Teachers can manage actions
CREATE POLICY "Teachers can manage eco actions"
ON public.eco_actions
AS PERMISSIVE
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'teacher'::app_role))
WITH CHECK (has_role(auth.uid(), 'teacher'::app_role));

-- Seed default actions
INSERT INTO public.eco_actions (action_key, name, name_ko, description, carbon_reduction, coin_value, icon, category) VALUES
  ('no-leftover', 'No Food Waste', '잔반 남기지 않기', '급식을 남기지 않고 깨끗이 먹었어요!', 150, 15, '🍽️', 'food'),
  ('milk-carton', 'Milk Carton Recycling', '우유팩 분리배출', '우유팩을 깨끗이 씻어 분리배출 했어요!', 30, 3, '🥛', 'recycling'),
  ('reuse-paper', 'Use Scrap Paper', '이면지 활용', '이면지를 사용해서 종이를 아꼈어요!', 25, 3, '📄', 'recycling'),
  ('personal-cup', 'Use Personal Cup', '개인 컵 사용', '일회용 컵 대신 개인 컵을 사용했어요!', 50, 5, '🥤', 'recycling'),
  ('lights-off', 'Turn Off Lights', '소등하기', '교실을 나갈 때 불을 껐어요!', 40, 4, '💡', 'energy'),
  ('water-saving', 'Save Water', '물 아껴쓰기', '손 씻을 때 물을 아껴 썼어요!', 20, 2, '💧', 'water'),
  ('walk-stairs', 'Use Stairs', '계단 이용하기', '엘리베이터 대신 계단을 이용했어요!', 35, 4, '🚶', 'transport'),
  ('eco-bag', 'Bring Eco Bag', '장바구니 사용', '비닐봉지 대신 에코백을 사용했어요!', 45, 5, '🛍️', 'recycling');

-- Add trigger for updated_at
CREATE TRIGGER update_eco_actions_updated_at
BEFORE UPDATE ON public.eco_actions
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
