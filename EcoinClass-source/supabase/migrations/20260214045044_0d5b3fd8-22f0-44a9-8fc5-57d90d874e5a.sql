-- Enable realtime on profiles so leaderboard auto-updates after mining
ALTER PUBLICATION supabase_realtime ADD TABLE public.profiles;