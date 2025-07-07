// File: src/components/evaluate.js
// Author: Cheng
// Description: 
//   Provides logic to evaluate habit and group completion status for a given date.
//   Supports three item types:
//   - Simple habits (daily goal check)
//   - Level-based habits (multi-tiered progress with thresholds)
//   - Groups (aggregated completion based on child items)
//   Returns a structured object with completion status and progress metadata 
//   used in UI components like CalendarView and GroupTree.

export function evaluateCompletion(items, id, selectedDate) {
  const item = items[id];
  if (!item) return { completed: false, count: 0, totalCount: 0 };

  // LEVEL HABIT
  if (item.type === 'habit' && item.levelEnabled) {
    const mainLevelIndex = item.currentMainLevel ?? 0;
    const progressMap = item.progressByMainLevel?.[mainLevelIndex] ?? {};
    const currentValue = progressMap[selectedDate] ?? 0;
    
    const totalCount = Object.values(progressMap).reduce((sum, v) => sum + v, 0);
    const threshold = item.levelThreshold || 100;
    const multiplier = item.levelMultiplier || 3;

    let level = 0;
    let base = threshold;
    let totalRequired = threshold;

    while (totalCount >= totalRequired) {
      level += 1;
      base *= multiplier;
      totalRequired += base;
    }
    const completed = currentValue >= item.dailyGoal;

    return {
      completed,
      level,
      mainLevelIndex,
      currentValue,
      requiredTarget: item.dailyGoal,
      count: 0,
      totalCount,
      nextLevelTotal: totalRequired
    };
  }

  // SIMPLE HABIT
  if (item.type === 'habit') {
    const currentValue = item.progressByDate?.[selectedDate] ?? 0;
    const completed = currentValue >= item.dailyGoal;
    return {
      completed,
      currentValue,
      requiredTarget: item.dailyGoal
    };
  }

  // GROUP
  if (item.type === 'group') {
    const results = item.children.map(childId =>
      evaluateCompletion(items, childId, selectedDate)
    );
    const count = results.filter(r => r.completed).length;
    const totalChildren = results.length;
    const completed = count >= item.targetCount;

    return {
      completed,
      count,
      requiredTarget: item.targetCount,
      totalChildren
    };
  }

  return { completed: false };
}
