/**
 * ARTISTRY AI — Practice Timer Engine
 * Wall-clock timestamp driven timer for timed traditional drawing sessions.
 * Safely withstands screen re-renders, state updates, and app backgrounding.
 */

import type { PracticeTimerState } from "./types";

/**
 * Creates an initial timer state for a practice session.
 */
export function createPracticeTimer(targetMinutes: number): PracticeTimerState {
  const safeMinutes = Math.max(1, Math.round(targetMinutes));
  return {
    targetDurationMinutes: safeMinutes,
    accumulatedMs: 0,
    startEpochMs: null,
    isRunning: false,
    isFinished: false,
  };
}

/**
 * Starts or resumes the timer at a specific epoch timestamp (default Date.now()).
 */
export function startPracticeTimer(timer: PracticeTimerState, nowMs: number = Date.now()): PracticeTimerState {
  if (timer.isRunning) return timer;
  return {
    ...timer,
    startEpochMs: nowMs,
    isRunning: true,
    isFinished: false,
  };
}

/**
 * Pauses the timer, banking current running segment into accumulatedMs.
 */
export function pausePracticeTimer(timer: PracticeTimerState, nowMs: number = Date.now()): PracticeTimerState {
  if (!timer.isRunning || timer.startEpochMs === null) {
    return { ...timer, isRunning: false };
  }
  const delta = Math.max(0, nowMs - timer.startEpochMs);
  return {
    ...timer,
    accumulatedMs: timer.accumulatedMs + delta,
    startEpochMs: null,
    isRunning: false,
  };
}

/**
 * Computes the total elapsed milliseconds up to nowMs.
 */
export function getElapsedMs(timer: PracticeTimerState, nowMs: number = Date.now()): number {
  let total = timer.accumulatedMs;
  if (timer.isRunning && timer.startEpochMs !== null) {
    total += Math.max(0, nowMs - timer.startEpochMs);
  }
  return total;
}

/**
 * Computes the total elapsed whole seconds up to nowMs.
 */
export function getElapsedSeconds(timer: PracticeTimerState, nowMs: number = Date.now()): number {
  return Math.floor(getElapsedMs(timer, nowMs) / 1000);
}

/**
 * Computes remaining whole seconds against target duration.
 * Clamps to 0 if elapsed exceeded target.
 */
export function getRemainingSeconds(timer: PracticeTimerState, nowMs: number = Date.now()): number {
  const targetSec = timer.targetDurationMinutes * 60;
  const elapsedSec = getElapsedSeconds(timer, nowMs);
  return Math.max(0, targetSec - elapsedSec);
}

/**
 * Progress ratio between 0.0 and 1.0.
 */
export function getTimerProgress(timer: PracticeTimerState, nowMs: number = Date.now()): number {
  const targetSec = timer.targetDurationMinutes * 60;
  if (targetSec <= 0) return 1.0;
  const elapsedSec = getElapsedSeconds(timer, nowMs);
  return Math.min(1.0, elapsedSec / targetSec);
}

/**
 * Checks whether elapsed time has met or exceeded target duration.
 */
export function isTimerCompleted(timer: PracticeTimerState, nowMs: number = Date.now()): boolean {
  const targetMs = timer.targetDurationMinutes * 60 * 1000;
  return getElapsedMs(timer, nowMs) >= targetMs;
}

/**
 * Finishes the timer and freezes elapsed time at current moment.
 */
export function finishPracticeTimer(timer: PracticeTimerState, nowMs: number = Date.now()): PracticeTimerState {
  const finalTimer = pausePracticeTimer(timer, nowMs);
  return {
    ...finalTimer,
    isFinished: true,
  };
}

/**
 * Resets the timer back to 0 accumulated with specified or preserved target.
 */
export function resetPracticeTimer(timer: PracticeTimerState, newTargetMinutes?: number): PracticeTimerState {
  return createPracticeTimer(newTargetMinutes ?? timer.targetDurationMinutes);
}

/**
 * Formats seconds into MM:SS or HH:MM:SS display string.
 */
export function formatTimerSeconds(seconds: number): string {
  const safeSec = Math.max(0, Math.floor(seconds));
  const hrs = Math.floor(safeSec / 3600);
  const mins = Math.floor((safeSec % 3600) / 60);
  const secs = safeSec % 60;

  const mm = mins.toString().padStart(2, "0");
  const ss = secs.toString().padStart(2, "0");

  if (hrs > 0) {
    const hh = hrs.toString().padStart(2, "0");
    return `${hh}:${mm}:${ss}`;
  }
  return `${mm}:${ss}`;
}
