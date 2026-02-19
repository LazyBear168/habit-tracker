// File: src/hooks/useMinuteTimer.js
// Author: Cheng (refactor assisted)
// Description:
//   A reusable minute-timer hook with optional countdown.
//   - Countdown defaults to 5 seconds (same as your current behavior)
//   - Elapsed time is tracked in seconds
//   - Provides start/cancel/stopAndCommit/toggle and a formatSec helper
//
// Notes:
//   This hook DOES NOT write to your habit data directly.
//   You pass in onCommitSeconds(seconds) to decide how to persist.

import { useCallback, useEffect, useRef, useState } from 'react';

export function useMinuteTimer({ enabled = true, countdownSeconds = 5, onCommitSeconds }) {
  const [isTiming, setIsTiming] = useState(false); // includes countdown or timing
  const [countdown, setCountdown] = useState(0); // remaining countdown seconds
  const [elapsedSec, setElapsedSec] = useState(0); // timing seconds after countdown

  const timerStartRef = useRef(null); // Date.now() ms
  const timerIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  const clearIntervals = useCallback(() => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  }, []);

  const resetState = useCallback(() => {
    setIsTiming(false);
    setCountdown(0);
    setElapsedSec(0);
    timerStartRef.current = null;
  }, []);

  const cancel = useCallback(() => {
    // stop without commit
    clearIntervals();
    resetState();
  }, [clearIntervals, resetState]);

  const stopAndCommit = useCallback(() => {
    // stop and commit elapsedSec
    clearIntervals();

    const secondsToAdd = elapsedSec;

    resetState();

    if (secondsToAdd > 0 && typeof onCommitSeconds === 'function') {
      onCommitSeconds(secondsToAdd);
    }
  }, [clearIntervals, elapsedSec, onCommitSeconds, resetState]);

  const start = useCallback(() => {
    if (!enabled) return;

    // fresh start
    clearIntervals();
    setElapsedSec(0);
    setIsTiming(true);
    setCountdown(countdownSeconds);

    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // countdown ends -> start actual timing
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }

          setCountdown(0);
          setElapsedSec(0);
          timerStartRef.current = Date.now();

          timerIntervalRef.current = setInterval(() => {
            const startMs = timerStartRef.current || Date.now();
            const diff = Math.floor((Date.now() - startMs) / 1000);
            setElapsedSec(diff);
          }, 1000);

          return 0;
        }

        return prev - 1;
      });
    }, 1000);
  }, [enabled, countdownSeconds, clearIntervals]);

  const toggle = useCallback(() => {
    if (!enabled) return;

    if (!isTiming) {
      start();
      return;
    }

    // if in countdown -> toggle means cancel (same as your current behavior)
    if (countdown > 0) {
      cancel();
      return;
    }

    // if timing -> stop & commit
    stopAndCommit();
  }, [enabled, isTiming, countdown, start, cancel, stopAndCommit]);

  const formatSec = useCallback((sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }, []);

  // cleanup on unmount
  useEffect(() => {
    return () => {
      clearIntervals();
    };
  }, [clearIntervals]);

  return {
    isTiming,
    countdown,
    elapsedSec,
    start,
    cancel,
    stopAndCommit,
    toggle,
    formatSec
  };
}
