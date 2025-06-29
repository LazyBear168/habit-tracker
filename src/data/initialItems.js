// Filename: src/data/initialItems.js

const initialItems = {
  workout: {
    id: 'workout',
    type: 'group',
    name: 'workout',
    children: ['pull_up', 'pushupGroup'],
    targetCount: 2,
    levelEnabled: true,
    levelStrategy: 'avg'
  },
  pull_up: {
    id: 'pull_up',
    type: 'habit',
    name: 'pull_up',
    unit: 'reps',
    dailyGoal: 8,
    startDate: '2024-01-01',
    endDate: null,
    levelEnabled: false,
    progressByDate: {
      '2025-06-27': 7
    }
  },
  pushupGroup: {
    id: 'pushupGroup',
    type: 'group',
    name: 'Push-Up Training',
    children: ['pushupLv', 'pushup'],
    targetCount: 1,
    levelEnabled: true,
    levelStrategy: 'max'
  },
  pushupLv: {
    id: 'pushupLv',
    type: 'habit',
    name: 'Push-Up',
    unit: 'reps',
    dailyGoal: 50,
    levelEnabled: true,
    levelThreshold: 100,
    levelCap: 10,
    currentMainLevel: 0,
    mainLevels: ['Push-Up','Elevation push-ups', 'One Hand Push-Up'],
    progressByMainLevel: {
      0: { '2025-06-27': 130 },
      1: { '2025-06-27': 5 }
    }
  },
  pushup: {
    id: 'pushup',
    type: 'habit',
    name: 'Elevation push-ups',
    unit: 'reps',
    dailyGoal: 50,
    levelEnabled: true,
    levelThreshold: 100,
    levelCap: 10,
    currentMainLevel: 0,
    mainLevels: ['Push-Up'],
    progressByMainLevel: {
      0: { '2025-06-27': 180 },
      1: { '2025-06-27': 5 }
    }
  }
};

export default initialItems;
