import { useState, useCallback } from 'react';
import { EcoAction, MiningRecord, Student, Transaction, Reward, ClassStats } from '@/types/eco-coin';
import { ecoActions } from '@/data/eco-actions';

// Generate mock weekly data
const generateWeeklyData = () => {
  const days = ['월', '화', '수', '목', '금'];
  return days.map((day, index) => ({
    date: day,
    coins: Math.floor(Math.random() * 50) + 30 + index * 10,
    carbon: Math.floor(Math.random() * 500) + 300 + index * 100,
  }));
};

const initialStudent: Student = {
  id: 'student-1',
  name: '김민준',
  totalCoins: 127,
  totalCarbonSaved: 1850,
  miningHistory: [],
};

const initialClassStats: ClassStats = {
  totalCoins: 2840,
  totalCarbonSaved: 42500,
  dailyData: generateWeeklyData(),
  topActions: [
    { actionId: 'no-leftover', count: 156 },
    { actionId: 'milk-carton', count: 98 },
    { actionId: 'lights-off', count: 87 },
  ],
};

export function useEcoCoin() {
  const [student, setStudent] = useState<Student>(initialStudent);
  const [classStats, setClassStats] = useState<ClassStats>(initialClassStats);
  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const mineAction = useCallback((action: EcoAction) => {
    const record: MiningRecord = {
      id: `mining-${Date.now()}`,
      actionId: action.id,
      studentId: student.id,
      timestamp: new Date(),
      coinsEarned: action.coinValue,
      carbonSaved: action.carbonReduction,
    };

    const transaction: Transaction = {
      id: `tx-${Date.now()}`,
      studentId: student.id,
      type: 'earn',
      amount: action.coinValue,
      description: action.nameKo,
      timestamp: new Date(),
    };

    setStudent((prev) => ({
      ...prev,
      totalCoins: prev.totalCoins + action.coinValue,
      totalCarbonSaved: prev.totalCarbonSaved + action.carbonReduction,
      miningHistory: [...prev.miningHistory, record],
    }));

    setClassStats((prev) => ({
      ...prev,
      totalCoins: prev.totalCoins + action.coinValue,
      totalCarbonSaved: prev.totalCarbonSaved + action.carbonReduction,
    }));

    setTransactions((prev) => [transaction, ...prev]);

    return record;
  }, [student.id]);

  const redeemReward = useCallback((reward: Reward) => {
    if (student.totalCoins < reward.cost) {
      return null;
    }

    const transaction: Transaction = {
      id: `tx-${Date.now()}`,
      studentId: student.id,
      type: reward.category === 'donation' ? 'donate' : 'spend',
      amount: reward.cost,
      description: reward.name,
      timestamp: new Date(),
      rewardId: reward.id,
    };

    setStudent((prev) => ({
      ...prev,
      totalCoins: prev.totalCoins - reward.cost,
    }));

    setTransactions((prev) => [transaction, ...prev]);

    return transaction;
  }, [student]);

  const getActionById = useCallback((id: string) => {
    return ecoActions.find((a) => a.id === id);
  }, []);

  return {
    student,
    classStats,
    transactions,
    mineAction,
    redeemReward,
    getActionById,
    actions: ecoActions,
  };
}
