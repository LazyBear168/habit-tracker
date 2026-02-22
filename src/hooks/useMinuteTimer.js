import { useCallback, useEffect, useRef, useState } from 'react';

export function useMinuteTimer({ enabled = true, countdownSeconds = 5, onCommitSeconds }) {
  const [isTiming, setIsTiming] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [elapsedSec, setElapsedSec] = useState(0);

  const timerStartRef = useRef(null);
  const timerIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // ✅ NEW: immediate state refs (avoid React state lag)
  const isTimingRef = useRef(false);
  const countdownRef = useRef(0);

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
    isTimingRef.current = false;       // ✅
    countdownRef.current = 0;          // ✅
    setIsTiming(false);
    setCountdown(0);
    setElapsedSec(0);
    timerStartRef.current = null;
  }, []);

  const cancel = useCallback(() => {
    clearIntervals();
    resetState();
  }, [clearIntervals, resetState]);

  const stopAndCommit = useCallback(() => {
    clearIntervals();

    const secondsToAdd = elapsedSec;

    resetState();

    if (secondsToAdd > 0 && typeof onCommitSeconds === 'function') {
      onCommitSeconds(secondsToAdd);
    }
  }, [clearIntervals, elapsedSec, onCommitSeconds, resetState]);

  const start = useCallback(() => {
    if (!enabled) return;

    // ✅ 防止「狂按」造成一直重啟倒數 / 疊 timer
    if (isTimingRef.current || timerIntervalRef.current || countdownIntervalRef.current) return;

    clearIntervals();
    setElapsedSec(0);

    isTimingRef.current = true;        // ✅ immediate
    setIsTiming(true);

    countdownRef.current = countdownSeconds;   // ✅ immediate
    setCountdown(countdownSeconds);

    countdownIntervalRef.current = setInterval(() => {
      // 用 ref 做判斷，比 state 穩
      const prev = countdownRef.current;

      if (prev <= 1) {
        // countdown ends -> start actual timing
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }

        countdownRef.current = 0;
        setCountdown(0);

        setElapsedSec(0);
        timerStartRef.current = Date.now();

        timerIntervalRef.current = setInterval(() => {
          const startMs = timerStartRef.current || Date.now();
          const diff = Math.floor((Date.now() - startMs) / 1000);
          setElapsedSec(diff);
        }, 1000);

        return;
      }

      countdownRef.current = prev - 1;
      setCountdown(countdownRef.current);
    }, 1000);
  }, [enabled, countdownSeconds, clearIntervals]);

  const toggle = useCallback(() => {
    if (!enabled) return;

    // ✅ 用 ref 判斷，避免第一次按完 state 還沒更新
    if (!isTimingRef.current) {
      start();
      return;
    }

    // countdown -> cancel
    if (countdownRef.current > 0) {
      cancel();
      return;
    }

    // timing -> stop & commit
    stopAndCommit();
  }, [enabled, start, cancel, stopAndCommit]);

  const formatSec = useCallback((sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  }, []);

  useEffect(() => () => clearIntervals(), [clearIntervals]);

  return { isTiming, countdown, elapsedSec, start, cancel, stopAndCommit, toggle, formatSec };
}