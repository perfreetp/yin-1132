import type { PsqiScores, RiskLevel } from '../types';

export const calculatePsqiTotal = (scores: PsqiScores): number => {
  return Object.values(scores).reduce((sum, score) => sum + (score ?? 0), 0);
};

export const isPsqiComplete = (scores: PsqiScores): boolean => {
  return Object.values(scores).every((score) => score !== null);
};

export const getIncompleteItems = (scores: PsqiScores): string[] => {
  const incomplete: string[] = [];
  psqiQuestions.forEach((q) => {
    if (scores[q.key as keyof PsqiScores] === null) {
      incomplete.push(q.label);
    }
  });
  return incomplete;
};

export const getRiskLevel = (totalScore: number): RiskLevel => {
  if (totalScore < 5) return 'low';
  if (totalScore <= 10) return 'medium';
  if (totalScore <= 15) return 'high';
  return 'extreme';
};

export const getFollowupInterval = (riskLevel: RiskLevel): number => {
  switch (riskLevel) {
    case 'low': return 30;
    case 'medium': return 14;
    case 'high': return 7;
    case 'extreme': return 3;
  }
};

export const getRiskLabel = (riskLevel: RiskLevel): string => {
  switch (riskLevel) {
    case 'low': return '低风险';
    case 'medium': return '中风险';
    case 'high': return '高风险';
    case 'extreme': return '极高风险';
  }
};

export const getRiskColor = (riskLevel: RiskLevel): string => {
  switch (riskLevel) {
    case 'low': return 'bg-green-100 text-green-800 border-green-200';
    case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
    case 'extreme': return 'bg-red-100 text-red-800 border-red-200';
  }
};

export const getScoreColor = (score: number): string => {
  if (score < 5) return 'text-green-600';
  if (score <= 10) return 'text-yellow-600';
  if (score <= 15) return 'text-orange-600';
  return 'text-red-600';
};

export const psqiQuestions = [
  {
    key: 'sleepQuality',
    label: '1. 睡眠质量',
    description: '近一个月，您对自己的睡眠质量总体评价：',
    options: [
      { value: 0, label: '很好' },
      { value: 1, label: '较好' },
      { value: 2, label: '较差' },
      { value: 3, label: '很差' }
    ]
  },
  {
    key: 'sleepLatency',
    label: '2. 入睡时间',
    description: '近一个月，您通常需要多长时间才能入睡：',
    options: [
      { value: 0, label: '≤15分钟' },
      { value: 1, label: '16-30分钟' },
      { value: 2, label: '31-60分钟' },
      { value: 3, label: '>60分钟' }
    ]
  },
  {
    key: 'sleepDuration',
    label: '3. 睡眠时间',
    description: '近一个月，您每晚实际睡眠时间约为：',
    options: [
      { value: 0, label: '≥7小时' },
      { value: 1, label: '6-7小时' },
      { value: 2, label: '5-6小时' },
      { value: 3, label: '<5小时' }
    ]
  },
  {
    key: 'sleepEfficiency',
    label: '4. 睡眠效率',
    description: '近一个月，您的睡眠效率（实际睡眠时间/卧床时间）：',
    options: [
      { value: 0, label: '≥85%' },
      { value: 1, label: '75-84%' },
      { value: 2, label: '65-74%' },
      { value: 3, label: '<65%' }
    ]
  },
  {
    key: 'sleepDisturbance',
    label: '5. 睡眠障碍',
    description: '近一个月，您因各种原因夜间醒来或早醒的频率：',
    options: [
      { value: 0, label: '无' },
      { value: 1, label: '每周<1次' },
      { value: 2, label: '每周1-2次' },
      { value: 3, label: '每周≥3次' }
    ]
  },
  {
    key: 'hypnoticDrug',
    label: '6. 催眠药物',
    description: '近一个月，您使用催眠药物的频率：',
    options: [
      { value: 0, label: '无' },
      { value: 1, label: '每周<1次' },
      { value: 2, label: '每周1-2次' },
      { value: 3, label: '每周≥3次' }
    ]
  },
  {
    key: 'daytimeDysfunction',
    label: '7. 日间功能',
    description: '近一个月，您白天困倦、精力不足的频率：',
    options: [
      { value: 0, label: '无' },
      { value: 1, label: '每周<1次' },
      { value: 2, label: '每周1-2次' },
      { value: 3, label: '每周≥3次' }
    ]
  }
];
