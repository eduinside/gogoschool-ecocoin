import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { toast } from 'sonner';

export interface Badge {
  id: string;
  key: string;
  name: string;
  description: string;
  icon: string;
  category: string;
  condition_type: string;
  condition_value: number;
}

export interface UserBadge {
  id: string;
  badge_id: string;
  earned_at: string;
  badge: Badge;
}

export function useBadges() {
  const { user, profile } = useAuth();
  const [allBadges, setAllBadges] = useState<Badge[]>([]);
  const [earnedBadges, setEarnedBadges] = useState<UserBadge[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchBadges = useCallback(async () => {
    const { data } = await supabase.from('badges').select('*').order('condition_value');
    if (data) setAllBadges(data);
  }, []);

  const fetchEarnedBadges = useCallback(async () => {
    if (!user) return;
    const { data: userBadgeData } = await supabase
      .from('user_badges')
      .select('*')
      .eq('user_id', user.id);

    if (userBadgeData && allBadges.length > 0) {
      setEarnedBadges(userBadgeData.map(ub => ({
        ...ub,
        badge: allBadges.find(b => b.id === ub.badge_id)!,
      })).filter(ub => ub.badge));
    }
  }, [user, allBadges]);

  // Check and award badges after mining
  const checkAndAwardBadges = useCallback(async () => {
    if (!user || !profile || allBadges.length === 0) return;

    // Get mining count
    const { count: miningCount } = await supabase
      .from('mining_records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id);

    // Get streak days
    const { data: recentRecords } = await supabase
      .from('mining_records')
      .select('created_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(30);

    let streakDays = 0;
    if (recentRecords && recentRecords.length > 0) {
      const uniqueDays = new Set(recentRecords.map(r => new Date(r.created_at).toDateString()));
      const today = new Date();
      for (let i = 0; i < 30; i++) {
        const checkDate = new Date(today);
        checkDate.setDate(checkDate.getDate() - i);
        if (uniqueDays.has(checkDate.toDateString())) {
          streakDays++;
        } else if (i > 0) break;
      }
    }

    // Get already earned badge IDs
    const { data: existingBadges } = await supabase
      .from('user_badges')
      .select('badge_id')
      .eq('user_id', user.id);
    const earnedIds = new Set((existingBadges || []).map(b => b.badge_id));

    // Check each badge
    const newBadges: Badge[] = [];
    for (const badge of allBadges) {
      if (earnedIds.has(badge.id)) continue;

      let earned = false;
      switch (badge.condition_type) {
        case 'mining_count':
          earned = (miningCount || 0) >= badge.condition_value;
          break;
        case 'total_coins':
          earned = profile.total_coins >= badge.condition_value;
          break;
        case 'total_carbon':
          earned = profile.total_carbon_saved >= badge.condition_value;
          break;
        case 'streak_days':
          earned = streakDays >= badge.condition_value;
          break;
      }

      if (earned) {
        const { error } = await supabase.from('user_badges').insert({
          user_id: user.id,
          badge_id: badge.id,
        });
        if (!error) newBadges.push(badge);
      }
    }

    if (newBadges.length > 0) {
      newBadges.forEach(badge => {
        toast.success(`🏅 새 뱃지 획득: ${badge.name}!`, {
          description: badge.description,
          duration: 5000,
        });
      });
      await fetchEarnedBadges();
    }
  }, [user, profile, allBadges, fetchEarnedBadges]);

  useEffect(() => {
    fetchBadges().then(() => setLoading(false));
  }, [fetchBadges]);

  useEffect(() => {
    if (allBadges.length > 0 && user) fetchEarnedBadges();
  }, [allBadges, user, fetchEarnedBadges]);

  return { allBadges, earnedBadges, loading, checkAndAwardBadges };
}
