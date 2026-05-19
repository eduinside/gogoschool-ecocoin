-- Create app_role enum for user roles
CREATE TYPE public.app_role AS ENUM ('student', 'teacher');

-- Create user_roles table for role management
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role app_role NOT NULL DEFAULT 'student',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create profiles table for student data
CREATE TABLE public.profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL UNIQUE,
    name TEXT NOT NULL,
    avatar_url TEXT,
    class_name TEXT DEFAULT '1반',
    total_coins INTEGER NOT NULL DEFAULT 0,
    total_carbon_saved INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create mining_records table
CREATE TABLE public.mining_records (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    action_id TEXT NOT NULL,
    coins_earned INTEGER NOT NULL,
    carbon_saved INTEGER NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on mining_records
ALTER TABLE public.mining_records ENABLE ROW LEVEL SECURITY;

-- Create transactions table
CREATE TABLE public.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('earn', 'spend', 'donate')),
    amount INTEGER NOT NULL,
    description TEXT NOT NULL,
    reward_id TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Create rewards table for available rewards
CREATE TABLE public.rewards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT NOT NULL,
    cost INTEGER NOT NULL,
    icon TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('privilege', 'item', 'donation')),
    available BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on rewards
ALTER TABLE public.rewards ENABLE ROW LEVEL SECURITY;

-- Create reward_requests table for pending approvals
CREATE TABLE public.reward_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    reward_id UUID REFERENCES public.rewards(id) ON DELETE CASCADE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    teacher_notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on reward_requests
ALTER TABLE public.reward_requests ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles" 
ON public.user_roles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view all roles" 
ON public.user_roles FOR SELECT 
USING (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Teachers can insert roles" 
ON public.user_roles FOR INSERT 
WITH CHECK (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Teachers can update roles" 
ON public.user_roles FOR UPDATE 
USING (public.has_role(auth.uid(), 'teacher'));

-- RLS Policies for profiles
CREATE POLICY "Users can view their own profile" 
ON public.profiles FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view all profiles" 
ON public.profiles FOR SELECT 
USING (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Anyone authenticated can view profiles for leaderboard" 
ON public.profiles FOR SELECT 
USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their own profile" 
ON public.profiles FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile" 
ON public.profiles FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for mining_records
CREATE POLICY "Users can view their own mining records" 
ON public.mining_records FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view all mining records" 
ON public.mining_records FOR SELECT 
USING (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Users can insert their own mining records" 
ON public.mining_records FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- RLS Policies for transactions
CREATE POLICY "Users can view their own transactions" 
ON public.transactions FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view all transactions" 
ON public.transactions FOR SELECT 
USING (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Users can insert their own transactions" 
ON public.transactions FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Teachers can update transactions" 
ON public.transactions FOR UPDATE 
USING (public.has_role(auth.uid(), 'teacher'));

-- RLS Policies for rewards
CREATE POLICY "Anyone can view available rewards" 
ON public.rewards FOR SELECT 
USING (true);

CREATE POLICY "Teachers can manage rewards" 
ON public.rewards FOR ALL 
USING (public.has_role(auth.uid(), 'teacher'));

-- RLS Policies for reward_requests
CREATE POLICY "Users can view their own reward requests" 
ON public.reward_requests FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Teachers can view all reward requests" 
ON public.reward_requests FOR SELECT 
USING (public.has_role(auth.uid(), 'teacher'));

CREATE POLICY "Users can insert their own reward requests" 
ON public.reward_requests FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Teachers can update reward requests" 
ON public.reward_requests FOR UPDATE 
USING (public.has_role(auth.uid(), 'teacher'));

-- Function to handle new user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile for new user
  INSERT INTO public.profiles (user_id, name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'name', NEW.email));
  
  -- Assign default role (student)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'student');
  
  RETURN NEW;
END;
$$;

-- Trigger to create profile on signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to update profile timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Triggers for updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_reward_requests_updated_at
  BEFORE UPDATE ON public.reward_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Insert default rewards
INSERT INTO public.rewards (name, description, cost, icon, category) VALUES
('자리 바꾸기', '원하는 자리로 이동할 수 있는 권한', 50, '🪑', 'privilege'),
('급식 우선권', '급식 배식 시 우선권 획득', 30, '🍽️', 'privilege'),
('숙제 면제권', '숙제 1회 면제 쿠폰', 100, '📝', 'privilege'),
('쉬는시간 연장', '쉬는시간 5분 연장권', 40, '⏰', 'privilege'),
('간식 교환권', '학급 간식 교환권', 60, '🍪', 'item'),
('친환경 연필', '재활용 연필 세트', 80, '✏️', 'item'),
('나무 심기 기부', '환경단체에 나무 1그루 기부', 200, '🌳', 'donation'),
('해양 정화 기부', '해양 정화 활동 기부', 150, '🌊', 'donation');