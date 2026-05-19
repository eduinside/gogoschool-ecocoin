import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { EcoAction } from '@/types/eco-coin';
import { ecoActions as defaultActions } from '@/data/eco-actions';
import { toast } from 'sonner';

interface DbEcoAction {
  id: string;
  action_key: string;
  name: string;
  name_ko: string;
  description: string;
  carbon_reduction: number;
  coin_value: number;
  icon: string;
  category: string;
  daily_limit: number | null;
  available: boolean;
}

interface DatabaseReward {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  category: string;
  available: boolean;
}

interface ClassStats {
  totalCoins: number;
  totalCarbonSaved: number;
  dailyData: { date: string; coins: number; carbon: number }[];
  topActions: { actionId: string; count: number }[];
}

export function useEcoDatabase() {
  const { user, profile, refreshProfile } = useAuth();
  const [rewards, setRewards] = useState<DatabaseReward[]>([]);
  const [dbActions, setDbActions] = useState<EcoAction[]>([]);
  const [dbActionsRaw, setDbActionsRaw] = useState<DbEcoAction[]>([]);
  const [classStats, setClassStats] = useState<ClassStats>({
    totalCoins: 0,
    totalCarbonSaved: 0,
    dailyData: [],
    topActions: [],
  });
  const [loading, setLoading] = useState(true);

  // Fetch eco actions from database
  const fetchActions = useCallback(async () => {
    const { data } = await supabase
      .from('eco_actions')
      .select('*')
      .eq('available', true)
      .order('created_at', { ascending: true });

    if (data) {
      setDbActionsRaw(data);
      setDbActions(data.map(a => ({
        id: a.action_key,
        name: a.name,
        nameKo: a.name_ko,
        description: a.description,
        carbonReduction: a.carbon_reduction,
        coinValue: a.coin_value,
        icon: a.icon,
        category: a.category as EcoAction['category'],
      })));
    }
  }, []);

  // Fetch rewards from database
  const fetchRewards = useCallback(async () => {
    const { data, error } = await supabase
      .from('rewards')
      .select('*')
      .eq('available', true);

    if (!error && data) {
      setRewards(data);
    }
  }, []);

  // Fetch class statistics
  const fetchClassStats = useCallback(async () => {
    const { data: profiles } = await supabase
      .from('profiles')
      .select('total_coins, total_carbon_saved');

    if (profiles) {
      const totalCoins = profiles.reduce((sum, p) => sum + p.total_coins, 0);
      const totalCarbonSaved = profiles.reduce((sum, p) => sum + p.total_carbon_saved, 0);

      const weekAgo = new Date();
      weekAgo.setDate(weekAgo.getDate() - 7);

      const { data: records } = await supabase
        .from('mining_records')
        .select('action_id, coins_earned, carbon_saved, created_at')
        .gte('created_at', weekAgo.toISOString());

      const days = ['일', '월', '화', '수', '목', '금', '토'];
      const dailyMap = new Map<string, { coins: number; carbon: number }>();
      
      for (let i = 4; i >= 0; i--) {
        const date = new Date();
        date.setDate(date.getDate() - i);
        const dayName = days[date.getDay()];
        if (!dailyMap.has(dayName)) {
          dailyMap.set(dayName, { coins: 0, carbon: 0 });
        }
      }

      if (records && records.length > 0) {
        records.forEach(record => {
          const date = new Date(record.created_at);
          const dayName = days[date.getDay()];
          const existing = dailyMap.get(dayName) || { coins: 0, carbon: 0 };
          dailyMap.set(dayName, {
            coins: existing.coins + record.coins_earned,
            carbon: existing.carbon + record.carbon_saved,
          });
        });

        const actionCounts = new Map<string, number>();
        records.forEach(record => {
          actionCounts.set(record.action_id, (actionCounts.get(record.action_id) || 0) + 1);
        });

        setClassStats({
          totalCoins,
          totalCarbonSaved,
          dailyData: Array.from(dailyMap.entries()).map(([date, data]) => ({ date, ...data })),
          topActions: Array.from(actionCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3)
            .map(([actionId, count]) => ({ actionId, count })),
        });
      } else {
        setClassStats({
          totalCoins,
          totalCarbonSaved,
          dailyData: Array.from(dailyMap.entries()).map(([date, data]) => ({ date, ...data })),
          topActions: [],
        });
      }
    }
  }, []);

  // Check daily mining limit
  const checkDailyLimit = useCallback(async (actionKey: string): Promise<boolean> => {
    if (!user) return false;
    const dbAction = dbActionsRaw.find(a => a.action_key === actionKey);
    if (!dbAction || dbAction.daily_limit === null) return true; // no limit

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { count } = await supabase
      .from('mining_records')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', user.id)
      .eq('action_id', actionKey)
      .gte('created_at', today.toISOString());

    return (count || 0) < dbAction.daily_limit;
  }, [user, dbActionsRaw]);

  // Mine an action
  // Quick limit check only (no DB writes)
  const canMine = useCallback(async (actionId: string): Promise<boolean> => {
    if (!user) return false;
    return checkDailyLimit(actionId);
  }, [user, checkDailyLimit]);

  // Perform the actual mining (call after canMine succeeds)
  const mineAction = useCallback(async (action: EcoAction) => {
    if (!user) return null;

    const { error: miningError } = await supabase
      .from('mining_records')
      .insert({
        user_id: user.id,
        action_id: action.id,
        coins_earned: action.coinValue,
        carbon_saved: action.carbonReduction,
      });

    if (miningError) {
      console.error('Mining error:', miningError);
      return null;
    }

    // Fire these in parallel, don't block UI
    Promise.all([
      supabase.from('transactions').insert({
        user_id: user.id,
        type: 'earn',
        amount: action.coinValue,
        description: action.nameKo,
        status: 'approved',
      }),
      supabase.rpc('increment_profile_totals', {
        _user_id: user.id,
        _coins: action.coinValue,
        _carbon: action.carbonReduction,
      }),
    ]).then(() => {
      refreshProfile();
      fetchClassStats();
    });

    return {
      id: `mining-${Date.now()}`,
      actionId: action.id,
      coinsEarned: action.coinValue,
      carbonSaved: action.carbonReduction,
    };
  }, [user, refreshProfile, fetchClassStats]);

  // Request a reward (needs teacher approval)
  const requestReward = useCallback(async (reward: DatabaseReward) => {
    if (!user || !profile) return null;

    if (profile.total_coins < reward.cost) {
      return { error: '코인이 부족합니다' };
    }

    const { error } = await supabase
      .from('reward_requests')
      .insert({
        user_id: user.id,
        reward_id: reward.id,
        status: 'pending',
      });

    if (error) {
      console.error('Reward request error:', error);
      return { error: error.message };
    }

    await supabase
      .from('profiles')
      .update({ total_coins: profile.total_coins - reward.cost })
      .eq('user_id', user.id);

    await supabase
      .from('transactions')
      .insert({
        user_id: user.id,
        type: reward.category === 'donation' ? 'donate' : 'spend',
        amount: reward.cost,
        description: reward.name,
        reward_id: reward.id,
        status: 'pending',
      });

    await refreshProfile();
    return { success: true };
  }, [user, profile, refreshProfile]);

  // Get action by ID (from DB actions)
  const getActionById = useCallback((id: string) => {
    const found = dbActions.find((a) => a.id === id);
    if (found) return found;
    return defaultActions.find((a) => a.id === id);
  }, [dbActions]);

  // Initial data fetch
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      await Promise.all([fetchActions(), fetchRewards(), fetchClassStats()]);
      setLoading(false);
    };
    loadData();
  }, [fetchActions, fetchRewards, fetchClassStats]);

  return {
    student: profile ? {
      id: profile.id,
      name: profile.name,
      totalCoins: profile.total_coins,
      totalCarbonSaved: profile.total_carbon_saved,
      miningHistory: [],
    } : null,
    classStats,
    rewards,
    actions: dbActions.length > 0 ? dbActions : defaultActions,
    loading,
    canMine,
    mineAction,
    requestReward,
    getActionById,
    refreshData: async () => {
      await Promise.all([fetchActions(), fetchRewards(), fetchClassStats(), refreshProfile()]);
    },
  };
}
