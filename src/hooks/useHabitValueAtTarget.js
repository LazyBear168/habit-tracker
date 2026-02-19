// File: src/hooks/useHabitValueAtTarget.js
// Author: Cheng (refactor assisted)
// Description:
//   Read/write raw habit value by a "target" object.
//   Target format:
//     { itemId, date, isLevelHabit, mainLevelIndex }
//
// Notes:
//   - rawValue is DB raw value (minutes habit stores seconds).
//   - This hook assumes you have `items` map and `updateItem` function.

import { useCallback } from 'react';

export function useHabitValueAtTarget({ items, updateItem }) {
  const getRawValueAtTarget = useCallback(
    (target) => {
      if (!target) return 0;

      const targetItem = items?.[target.itemId];
      if (!targetItem) return 0;

      if (target.isLevelHabit) {
        return targetItem.progressByMainLevel?.[target.mainLevelIndex]?.[target.date] ?? 0;
      }
      return targetItem.progressByDate?.[target.date] ?? 0;
    },
    [items]
  );

  const setRawValueAtTarget = useCallback(
    (target, newValue) => {
      if (!target) return;

      const targetItem = items?.[target.itemId];
      if (!targetItem) return;

      if (target.isLevelHabit) {
        updateItem({
          ...targetItem,
          progressByMainLevel: {
            ...targetItem.progressByMainLevel,
            [target.mainLevelIndex]: {
              ...(targetItem.progressByMainLevel?.[target.mainLevelIndex] || {}),
              [target.date]: newValue
            }
          }
        });
      } else {
        updateItem({
          ...targetItem,
          progressByDate: {
            ...targetItem.progressByDate,
            [target.date]: newValue
          }
        });
      }
    },
    [items, updateItem]
  );

  const addRawValueAtTarget = useCallback(
    (target, delta) => {
      const current = Number(getRawValueAtTarget(target)) || 0;
      const next = current + (Number(delta) || 0);
      setRawValueAtTarget(target, next);
    },
    [getRawValueAtTarget, setRawValueAtTarget]
  );

  return {
    getRawValueAtTarget,
    setRawValueAtTarget,
    addRawValueAtTarget
  };
}
