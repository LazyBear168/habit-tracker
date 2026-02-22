// File: src/hooks/useSyncedBoundHabitTimer.js
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, runTransaction, serverTimestamp } from 'firebase/firestore';

function buildTimerDocId(target) {
  const lv = target?.isLevelHabit ? `L${target.mainLevelIndex ?? 0}` : 'N';
  return `${target.itemId}__${target.date}__${lv}`;
}

export function useSyncedBoundHabitTimer({
  enabled,
  userId,
  countdownSeconds = 5,
  getBindTarget,
  getCurrentValueAtTarget,
  commitValueAtTarget
}) {
  const targetRef = useRef(null);

  const countdownAbortRef = useRef({ aborted: false });
  const countdownRunningRef = useRef(false);

  const [countdown, setCountdown] = useState(0);

  const [state, setState] = useState('idle'); // idle | running | paused
  const [accumulatedSec, setAccumulatedSec] = useState(0);
  const [startedAtMs, setStartedAtMs] = useState(null);

  const [displaySec, setDisplaySec] = useState(0);

  const isTiming = state === 'running' || countdown > 0;

  // 取得「目前這個 row 應該綁定的 target」
  // 注意：如果 getBindTarget 不是 stable function，建議你在呼叫 hook 的地方用 useCallback 包起來
  const bindTarget = getBindTarget?.() ?? null;

  const buildDocRefFromTarget = useCallback(
    (target) => {
      const timerId = buildTimerDocId(target);
      return doc(db, 'users', userId, 'timers', timerId);
    },
    [userId]
  );

  const timerDocRef = useMemo(() => {
    if (!userId || !bindTarget) return null;
    return buildDocRefFromTarget(bindTarget);
  }, [userId, bindTarget, buildDocRefFromTarget]);

  // Subscribe: 兩台裝置只要 bindTarget 一樣，就會訂到同一份 doc
  useEffect(() => {
  if (!enabled) return;
  if (!timerDocRef) return;

  const unsub = onSnapshot(
    timerDocRef,
    (snap) => {
      console.log('[TIMER] snapshot', snap.exists(), snap.data());

      if (!snap.exists()) {
        setState('idle');
        setAccumulatedSec(0);
        setStartedAtMs(null);
        return;
      }

      const d = snap.data() || {};
      setState(d.state || 'idle');
      setAccumulatedSec(Number(d.accumulatedSec) || 0);
      setStartedAtMs(d.startedAt?.toMillis ? d.startedAt.toMillis() : null);
    },
    (err) => {
      console.error('[TIMER] onSnapshot error', err);
    }
  );

  return () => unsub();
}, [enabled, timerDocRef]);
  useEffect(() => {
  if (!enabled) return;
  console.log('[TIMER] bindTarget =', bindTarget);
  if (bindTarget) console.log('[TIMER] docId =', buildTimerDocId(bindTarget));
}, [enabled, bindTarget]);

useEffect(() => {
  if (!enabled || !timerDocRef) return;
  console.log('[TIMER] subscribing to', timerDocRef.path);
}, [enabled, timerDocRef]);

  // Local tick (UI): 根據 startedAtMs + accumulatedSec 算顯示
  useEffect(() => {
    if (!enabled) return;

    if (state !== 'running' || !startedAtMs) {
      setDisplaySec(accumulatedSec);
      return;
    }

    const id = setInterval(() => {
      const delta = Math.floor((Date.now() - startedAtMs) / 1000);
      setDisplaySec(accumulatedSec + Math.max(0, delta));
    }, 250);

    return () => clearInterval(id);
  }, [enabled, state, startedAtMs, accumulatedSec]);

  const formatSec = useCallback((sec) => {
    const s = Math.max(0, Math.floor(Number(sec) || 0));
    const mm = String(Math.floor(s / 60)).padStart(2, '0');
    const ss = String(s % 60).padStart(2, '0');
    return `${mm}:${ss}`;
  }, []);

  const ensureDocExists = useCallback(
    async (docRef) => {
      await runTransaction(db, async (tx) => {
        const snap = await tx.get(docRef);
        if (!snap.exists()) {
          tx.set(docRef, {
            state: 'idle',
            accumulatedSec: 0,
            startedAt: null,
            updatedAt: serverTimestamp(),
            version: 0
          });
        }
      });
    },
    [db]
  );

  const start = useCallback(async () => {
    if (!enabled) return;
    if (!userId) return;

    if (countdownRunningRef.current) return;
    if (state === 'running') return;

    const resolvedTarget = targetRef.current ?? bindTarget ?? (getBindTarget?.() ?? null);
    if (!resolvedTarget) return;
    targetRef.current = resolvedTarget;

    const localDocRef = buildDocRefFromTarget(resolvedTarget);

    // ✅ 只在不存在時初始化，避免蓋掉別台正在 running 的狀態
    await ensureDocExists(localDocRef);

    // 如果別台已經在跑，就不要再啟動倒數
    // （讓 UI 直接跟著 snapshot 跑）
    // 這段是保險：避免雙裝置互相搶狀態
    const skipBecauseAlreadyRunning = await runTransaction(db, async (tx) => {
      const snap = await tx.get(localDocRef);
      const d = snap.exists() ? snap.data() : {};
      return d?.state === 'running';
    });
    if (skipBecauseAlreadyRunning) return;

    countdownAbortRef.current = { aborted: false };
    countdownRunningRef.current = true;

    try {
      setCountdown(countdownSeconds);
      const token = countdownAbortRef.current;

      for (let t = countdownSeconds; t > 0; t--) {
        // eslint-disable-next-line no-await-in-loop
        await new Promise((r) => setTimeout(r, 1000));
        if (token.aborted) return;
        setCountdown((prev) => Math.max(0, prev - 1));
      }

      await runTransaction(db, async (tx) => {
        const snap = await tx.get(localDocRef);
        const d = snap.exists() ? snap.data() : {};
        if (d?.state === 'running') return;

        const nextVersion = (Number(d?.version) || 0) + 1;

        tx.set(
          localDocRef,
          {
            state: 'running',
            startedAt: serverTimestamp(),
            updatedAt: serverTimestamp(),
            version: nextVersion
          },
          { merge: true }
        );
      });
    } finally {
      countdownRunningRef.current = false;
    }
  }, [
    enabled,
    userId,
    state,
    bindTarget,
    getBindTarget,
    countdownSeconds,
    buildDocRefFromTarget,
    ensureDocExists,
    db
  ]);

  const cancel = useCallback(() => {
    if (countdownAbortRef.current) countdownAbortRef.current.aborted = true;
    countdownRunningRef.current = false;

    setCountdown(0);

    // UI 保險：回到目前累積（通常 0）
    setStartedAtMs(null);
    setDisplaySec(accumulatedSec);

    // 不清 targetRef：因為你可能要在同一 row 繼續操作
    // targetRef.current = null;
  }, [accumulatedSec]);

  const pause = useCallback(async () => {
    if (!enabled) return;
    if (!userId) return;

    const resolvedTarget = targetRef.current ?? bindTarget;
    if (!resolvedTarget) return;
    targetRef.current = resolvedTarget;

    const localDocRef = buildDocRefFromTarget(resolvedTarget);

    await runTransaction(db, async (tx) => {
      const snap = await tx.get(localDocRef);
      if (!snap.exists()) return;

      const d = snap.data() || {};
      if (d.state !== 'running' || !d.startedAt?.toMillis) return;

      const acc = Number(d.accumulatedSec) || 0;
      const started = d.startedAt.toMillis();
      const delta = Math.floor((Date.now() - started) / 1000);
      const add = Math.max(0, delta);

      const nextVersion = (Number(d.version) || 0) + 1;

      tx.set(
        localDocRef,
        {
          state: 'paused',
          accumulatedSec: acc + add,
          startedAt: null,
          updatedAt: serverTimestamp(),
          version: nextVersion
        },
        { merge: true }
      );
    });
  }, [enabled, userId, bindTarget, buildDocRefFromTarget, db]);

  const stopAndCommit = useCallback(async () => {
    if (!enabled) return;
    if (!userId) return;

    // ✅ B 裝置也能 stop：用 bindTarget 當 fallback
    const resolvedTarget = targetRef.current ?? bindTarget;
    if (!resolvedTarget) return;
    targetRef.current = resolvedTarget;

    const localDocRef = buildDocRefFromTarget(resolvedTarget);

    const secondsToCommit = await runTransaction(db, async (tx) => {
      const snap = await tx.get(localDocRef);
      if (!snap.exists()) return 0;

      const d = snap.data() || {};
      const acc = Number(d.accumulatedSec) || 0;

      let add = 0;
      if (d.state === 'running' && d.startedAt?.toMillis) {
        const started = d.startedAt.toMillis();
        const delta = Math.floor((Date.now() - started) / 1000);
        add = Math.max(0, delta);
      }

      const total = acc + add;
      const nextVersion = (Number(d.version) || 0) + 1;

      tx.set(
        localDocRef,
        {
          state: 'idle',
          accumulatedSec: 0,
          startedAt: null,
          updatedAt: serverTimestamp(),
          version: nextVersion
        },
        { merge: true }
      );

      return total;
    });

    if (secondsToCommit > 0) {
      const current = Number(getCurrentValueAtTarget?.(resolvedTarget)) || 0;
      commitValueAtTarget?.(resolvedTarget, current + secondsToCommit);
    }

    // UI 保險：立刻停
    setCountdown(0);
    setStartedAtMs(null);
    setDisplaySec(0);
  }, [
    enabled,
    userId,
    bindTarget,
    buildDocRefFromTarget,
    db,
    getCurrentValueAtTarget,
    commitValueAtTarget
  ]);

  const toggleBound = useCallback(() => {
    if (!enabled) return;

    if (!isTiming) {
      start();
      return;
    }

    if (countdown > 0) {
      cancel();
      return;
    }

    if (state === 'running') {
      stopAndCommit();
      return;
    }

    // paused/idle -> start
    start();
  }, [enabled, isTiming, countdown, state, start, cancel, stopAndCommit]);

  return {
    state,
    isTiming,
    countdown,
    elapsedSec: displaySec,
    formatSec,
    start,
    pause,
    stopAndCommit,
    toggleBound,
    cancelBound: cancel,
    boundTarget: targetRef.current
  };
}