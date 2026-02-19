// File: src/utils/habitValueAdapter.js
// Author: Cheng (refactor assisted)
// Description:
//   Adapter for "raw stored value" <-> "UI input string"
//   - minutes habits store raw as seconds, but UI shows minutes
//   - other units store raw as number directly

export function getInputStep(isMinuteUnit) {
  return isMinuteUnit ? '0.1' : '1';
}

export function rawToInputString(rawValue, isMinuteUnit) {
  const n = Number(rawValue);
  if (!isFinite(n) || n <= 0) return ''; // keep your old behavior: 0 -> empty

  if (isMinuteUnit) {
    return (n / 60).toFixed(1); // seconds -> minutes
  }
  return String(n);
}

export function inputStringToRaw(inputStr, isMinuteUnit) {
  const num = parseFloat(inputStr);
  if (Number.isNaN(num) || num < 0) return null;

  if (isMinuteUnit) {
    return Math.round(num * 60); // minutes -> seconds
  }
  return num;
}

export function rawToDisplayString(rawValue, isMinuteUnit) {
  // for your readOnly input display
  const n = Number(rawValue);
  if (!isFinite(n)) return '';
  if (n === 0) return '';

  if (isMinuteUnit) return (n / 60).toFixed(1);
  return String(n);
}
