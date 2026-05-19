export interface EcoAction {
  id: string;
  name: string;
  nameKo: string;
  description: string;
  carbonReduction: number; // in grams
  coinValue: number;
  icon: string;
  category: 'food' | 'recycling' | 'energy' | 'water' | 'transport';
}

export interface MiningRecord {
  id: string;
  actionId: string;
  studentId: string;
  timestamp: Date;
  coinsEarned: number;
  carbonSaved: number;
}

export interface Student {
  id: string;
  name: string;
  avatar?: string;
  totalCoins: number;
  totalCarbonSaved: number;
  miningHistory: MiningRecord[];
}

export interface ClassStats {
  totalCoins: number;
  totalCarbonSaved: number;
  dailyData: {
    date: string;
    coins: number;
    carbon: number;
  }[];
  topActions: {
    actionId: string;
    count: number;
  }[];
}

export interface Reward {
  id: string;
  name: string;
  description: string;
  cost: number;
  icon: string;
  category: 'privilege' | 'item' | 'donation';
  available: boolean;
}

export interface Transaction {
  id: string;
  studentId: string;
  type: 'earn' | 'spend' | 'donate';
  amount: number;
  description: string;
  timestamp: Date;
  rewardId?: string;
}
