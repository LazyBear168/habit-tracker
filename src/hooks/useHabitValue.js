// File: src/hooks/useHabitValue.js
// Author: Cheng (refactor assisted)
//
// Purpose:
// Single source of truth for today's value read/write
// Supports normal + level habit
// UI uses display value, DB uses raw value
//
// Description:
//   Centralize read/write "today's value" for normal habits and level habits.
//   Provides BOTH raw API (DB format) and display API (UI format).
//
// Raw format:
//   - minutes habit stores seconds in DB (rawValue in seconds)
//   - other units store number directly
//
// Display format:
//   - minutes habit shows minutes (can be decimals)
//   - other units show raw number directly
//
// Notes:
//   - Keep UI conversion here so GroupTree doesn't need `* 60` everywhere.

import { useCallback, useMemo } from 'react';

export function useHabitValue({
  item,
  selectedDate,
  updateItem,
  isLevelHabit,
  mainLevelIndex,
  isMinuteUnit // ✅ NEW: pass in from GroupTree
}) {
  const rawValue = useMemo(() => {
    if (!item) return 0;

    return isLevelHabit
      ? item.progressByMainLevel?.[mainLevelIndex]?.[selectedDate] ?? 0
      : item.progressByDate?.[selectedDate] ?? 0;
  }, [item, selectedDate, isLevelHabit, mainLevelIndex]);

  const setRawValue = useCallback(
    (newVal) => {
      if (!item) return;

      if (isLevelHabit) {
        updateItem({
          ...item,
          progressByMainLevel: {
            ...item.progressByMainLevel,
            [mainLevelIndex]: {
              ...(item.progressByMainLevel?.[mainLevelIndex] || {}),
              [selectedDate]: newVal
            }
          }
        });
      } else {
        updateItem({
          ...item,
          progressByDate: {
            ...item.progressByDate,
            [selectedDate]: newVal
          }
        });
      }
    },
    [item, selectedDate, updateItem, isLevelHabit, mainLevelIndex]
  );

  const addRawValue = useCallback(
    (delta) => {
      const current = Number(rawValue) || 0;
      const next = current + (Number(delta) || 0);
      setRawValue(next);
    },
    [rawValue, setRawValue]
  );

  // ---------------------------
  // ✅ Display API (UI format)
  // ---------------------------

  const displayValue = useMemo(() => {
    if (rawValue === '' || rawValue === null || rawValue === undefined) return '';
    const n = Number(rawValue) || 0;

    // minutes habit: raw is seconds, display is minutes (1 decimal)
    if (isMinuteUnit) return (n / 60).toFixed(1);

    // other units: show as string
    return String(n);
  }, [rawValue, isMinuteUnit]);

  const inputStep = useMemo(() => {
    return isMinuteUnit ? '0.1' : '1';
  }, [isMinuteUnit]);

  const setDisplayValue = useCallback(
    (displayNum) => {
      const n = Number(displayNum);
      if (Number.isNaN(n) || n < 0) return;

      if (isMinuteUnit) {
        // minutes -> seconds
        const sec = Math.round(n * 60);
        setRawValue(sec);
      } else {
        setRawValue(n);
      }
    },
    [isMinuteUnit, setRawValue]
  );

  const addDisplayValue = useCallback(
    (deltaDisplay) => {
      const delta = Number(deltaDisplay) || 0;
      if (delta === 0) return;

      if (isMinuteUnit) {
        addRawValue(delta * 60);
      } else {
        addRawValue(delta);
      }
    },
    [isMinuteUnit, addRawValue]
  );

  return {
    // raw API
    rawValue, // DB raw value (minutes habit = seconds)
    setRawValue,
    addRawValue,

    // display API
    displayValue, // UI string
    inputStep, // '0.1' or '1'
    setDisplayValue,
    addDisplayValue
  };
}
