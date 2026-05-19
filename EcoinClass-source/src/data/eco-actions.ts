import { EcoAction, Reward } from '@/types/eco-coin';

// Exchange rate: 10g CO2 = 1 Eco-Coin
export const CARBON_TO_COIN_RATE = 10;

export const ecoActions: EcoAction[] = [
  {
    id: 'no-leftover',
    name: 'No Food Waste',
    nameKo: '잔반 남기지 않기',
    description: '급식을 남기지 않고 깨끗이 먹었어요!',
    carbonReduction: 150,
    coinValue: 15,
    icon: '🍽️',
    category: 'food',
  },
  {
    id: 'milk-carton',
    name: 'Milk Carton Recycling',
    nameKo: '우유팩 분리배출',
    description: '우유팩을 깨끗이 씻어 분리배출 했어요!',
    carbonReduction: 30,
    coinValue: 3,
    icon: '🥛',
    category: 'recycling',
  },
  {
    id: 'reuse-paper',
    name: 'Use Scrap Paper',
    nameKo: '이면지 활용',
    description: '이면지를 사용해서 종이를 아꼈어요!',
    carbonReduction: 25,
    coinValue: 3,
    icon: '📄',
    category: 'recycling',
  },
  {
    id: 'personal-cup',
    name: 'Use Personal Cup',
    nameKo: '개인 컵 사용',
    description: '일회용 컵 대신 개인 컵을 사용했어요!',
    carbonReduction: 50,
    coinValue: 5,
    icon: '🥤',
    category: 'recycling',
  },
  {
    id: 'lights-off',
    name: 'Turn Off Lights',
    nameKo: '소등하기',
    description: '교실을 나갈 때 불을 껐어요!',
    carbonReduction: 40,
    coinValue: 4,
    icon: '💡',
    category: 'energy',
  },
  {
    id: 'water-saving',
    name: 'Save Water',
    nameKo: '물 아껴쓰기',
    description: '손 씻을 때 물을 아껴 썼어요!',
    carbonReduction: 20,
    coinValue: 2,
    icon: '💧',
    category: 'water',
  },
  {
    id: 'walk-stairs',
    name: 'Use Stairs',
    nameKo: '계단 이용하기',
    description: '엘리베이터 대신 계단을 이용했어요!',
    carbonReduction: 35,
    coinValue: 4,
    icon: '🚶',
    category: 'transport',
  },
  {
    id: 'eco-bag',
    name: 'Bring Eco Bag',
    nameKo: '장바구니 사용',
    description: '비닐봉지 대신 에코백을 사용했어요!',
    carbonReduction: 45,
    coinValue: 5,
    icon: '🛍️',
    category: 'recycling',
  },
];

export const rewards: Reward[] = [
  {
    id: 'seat-change',
    name: '자리 바꾸기권',
    description: '원하는 친구 옆자리로 이동할 수 있어요!',
    cost: 80,
    icon: '🪑',
    category: 'privilege',
    available: true,
  },
  {
    id: 'lunch-first',
    name: '급식 우선권',
    description: '맛있는 급식을 먼저 받을 수 있어요!',
    cost: 30,
    icon: '🍱',
    category: 'privilege',
    available: true,
  },
  {
    id: 'homework-pass',
    name: '숙제 면제권',
    description: '숙제 한 번을 면제받을 수 있어요!',
    cost: 100,
    icon: '📝',
    category: 'privilege',
    available: true,
  },
  {
    id: 'free-reading',
    name: '자유 독서 시간',
    description: '10분간 자유롭게 책을 읽을 수 있어요!',
    cost: 20,
    icon: '📚',
    category: 'privilege',
    available: true,
  },
  {
    id: 'tree-donation',
    name: '나무 심기 기부',
    description: '나무 심기 단체에 기부할 수 있어요!',
    cost: 200,
    icon: '🌳',
    category: 'donation',
    available: true,
  },
  {
    id: 'sticker',
    name: '친환경 스티커',
    description: '예쁜 친환경 스티커를 받을 수 있어요!',
    cost: 15,
    icon: '⭐',
    category: 'item',
    available: true,
  },
];

export const getCategoryColor = (category: EcoAction['category']): string => {
  const colors = {
    food: 'bg-orange-100 text-orange-700 border-orange-200',
    recycling: 'bg-blue-100 text-blue-700 border-blue-200',
    energy: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    water: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    transport: 'bg-green-100 text-green-700 border-green-200',
  };
  return colors[category];
};

export const getCategoryLabel = (category: EcoAction['category']): string => {
  const labels = {
    food: '음식',
    recycling: '재활용',
    energy: '에너지',
    water: '물',
    transport: '이동',
  };
  return labels[category];
};
