// File: src/hooks/useBoundHabitTimer.js
// Author: Cheng (refactor assisted)
// Description:
//   A habit-specific timer controller built on top of useMinuteTimer.
//   It "binds" the commit target at Start time:
//     - habitId (itemId)
//     - date (selectedDate)
//     - isLevelHabit + mainLevelIndex
//   So switching UI selection won't change where the time is committed.

import { useRef } from 'react';
import { useMinuteTimer } from './useMinuteTimer';

export function useBoundHabitTimer({
  enabled,
  countdownSeconds = 5,

  // binding info at Start time
  getBindTarget, // () => ({ itemId, date, isLevelHabit, mainLevelIndex })

  // commit implementation (how to read/write the data)
  getCurrentValueAtTarget, // (target) => number
  commitValueAtTarget // (target, newValue) => void
}) {
  const targetRef = useRef(null);

  // keep latest callbacks (avoid stale closures)
  const getBindTargetRef = useRef(getBindTarget);
  const getCurrentValueAtTargetRef = useRef(getCurrentValueAtTarget);
  const commitValueAtTargetRef = useRef(commitValueAtTarget);

  getBindTargetRef.current = getBindTarget;
  getCurrentValueAtTargetRef.current = getCurrentValueAtTarget;
  commitValueAtTargetRef.current = commitValueAtTarget;

  const timer = useMinuteTimer({
    enabled,
    countdownSeconds,
    onCommitSeconds: (secondsToAdd) => {
      if (secondsToAdd <= 0) return;

      const target = targetRef.current;
      if (!target) return;

      // read current value from latest callback
      const current = Number(getCurrentValueAtTargetRef.current?.(target)) || 0;
      const newVal = current + secondsToAdd;

      // commit via latest callback
      commitValueAtTargetRef.current?.(target, newVal);

      // clear after commit (always clear to avoid stuck target)
      targetRef.current = null;
    }
  });

  const toggleBound = () => {
    if (!enabled) return;

    // Start -> bind target first
    if (!timer.isTiming) {
      targetRef.current = getBindTargetRef.current?.() ?? null;
      timer.start();
      return;
    }

    // Countdown -> cancel (and clear target)
    if (timer.countdown > 0) {
      timer.cancel();
      targetRef.current = null;
      return;
    }

    // Timing -> stop & commit (commit goes to bound target)
    timer.stopAndCommit();
  };

  const cancel = () => {
    timer.cancel();
    targetRef.current = null;
  };

  return {
    ...timer,
    toggleBound,
    cancelBound: cancel,
    boundTarget: targetRef.current
  };
}
