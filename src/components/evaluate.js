// File: src/components/evaluate.js
// Author: Cheng
// Description:
//   Evaluate habit/group completion for a date.
//   NOTE: For unit === 'minutes', progress is stored in SECONDS.
//   So dailyGoal / thresholds must be converted to seconds for calculations.

const isMinutesUnit = (item) => String(item?.unit || '').toLowerCase() === 'minutes';

// Convert target numbers (minutes) -> seconds when unit is minutes.
// For non-minutes units, keep as-is.
const toProgressUnit = (item, value) => {
  const n = Number(value) || 0;
  return isMinutesUnit(item) ? n * 60 : n;
};

export function evaluateCompletion(items, id, selectedDate) {
  const item = items[id];
  if (!item) return { completed: false, count: 0, totalCount: 0 };

  // LEVEL HABIT
  if (item.type === 'habit' && item.levelEnabled) {
    const mainLevelIndex = item.currentMainLevel ?? 0;
    const progressMap = item.progressByMainLevel?.[mainLevelIndex] ?? {};

    // progress values are:
    // - seconds if unit === minutes
    // - original unit otherwise
    const currentValue = Number(progressMap[selectedDate] ?? 0);
    const totalCount = Object.values(progressMap).reduce((sum, v) => sum + (Number(v) || 0), 0);

    // thresholds are stored in UI units (minutes when unit === minutes)
    const thresholdUI = item.levelThreshold || 100;
    const multiplier = item.levelMultiplier || 3;

    // Convert threshold to progress unit if needed (minutes -> seconds)
    let base = toProgressUnit(item, thresholdUI);
    let totalRequired = base;

    let level = 0;
    while (totalCount >= totalRequired) {
      level += 1;
      base *= multiplier;
      totalRequired += base;
    }

    // dailyGoal is in UI units (minutes when unit === minutes)
    const requiredTargetUI = item.dailyGoal || 0;
    const requiredTarget = toProgressUnit(item, requiredTargetUI);

    const completed = currentValue >= requiredTarget;

    return {
      completed,
      level,
      mainLevelIndex,
      currentValue,              // in progress unit (sec if minutes)
      requiredTarget: requiredTargetUI, // keep UI unit for display (minutes)
      count: 0,
      totalCount,                // in progress unit
      nextLevelTotal: totalRequired // in progress unit
    };
  }

  // SIMPLE HABIT
  if (item.type === 'habit') {
    const currentValue = Number(item.progressByDate?.[selectedDate] ?? 0);

    const requiredTargetUI = item.dailyGoal || 0;
    const requiredTarget = toProgressUnit(item, requiredTargetUI);

    const completed = currentValue >= requiredTarget;

    return {
      completed,
      currentValue,                 // in progress unit (sec if minutes)
      requiredTarget: requiredTargetUI // UI unit for display (minutes)
    };
  }

  // GROUP
  if (item.type === 'group') {
    const results = item.children.map((childId) => evaluateCompletion(items, childId, selectedDate));
    const count = results.filter((r) => r.completed).length;
    const totalChildren = results.length;
    const completed = count >= (item.targetCount || 0);

    return {
      completed,
      count,
      requiredTarget: item.targetCount,
      totalChildren
    };
  }

  return { completed: false };
}
