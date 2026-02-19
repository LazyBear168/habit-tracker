// File: src/components/HabitValueCalculator.jsx
// Author: Cheng (refactor assisted)
// Description:
//   Inline calculator widget (button + input) with unit adapter.
//   - rawValue is stored value (minutes habit uses seconds)
//   - commitRawValue writes raw stored value back (seconds for minutes)

import { useEffect, useRef, useState } from 'react';
import { useClickOutside } from '../hooks/useClickOutside';
import { getInputStep, inputStringToRaw, rawToInputString } from '../utils/habitValueAdapter';

export default function HabitValueCalculator({
  isMinuteUnit,
  rawValue,
  commitRawValue,
  title = '輸入數值 (Input value)'
}) {
  const [open, setOpen] = useState(false);
  const [valueStr, setValueStr] = useState('');

  const wrapRef = useRef(null);
  const inputRef = useRef(null);

  const closeAndClear = () => {
    setOpen(false);
    setValueStr('');
  };

  const commitIfValidThenClose = () => {
    const raw = inputStringToRaw(valueStr, isMinuteUnit);
    if (raw !== null) {
      commitRawValue(raw);
    }
    closeAndClear();
  };

  useClickOutside(wrapRef, commitIfValidThenClose, open);

  const openCalculator = () => {
    setValueStr(rawToInputString(rawValue, isMinuteUnit));
    setOpen(true);
  };

  useEffect(() => {
    if (open && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [open]);

  return (
    <div style={{ display: 'inline-block', position: 'relative' }} ref={wrapRef}>
      {!open ? (
        <button
          type="button"
          onClick={openCalculator}
          title={title}
          style={{
            background: 'none',
            border: '1px solid #ccc',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '16px',
            padding: '2px 8px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.2s'
          }}
          onMouseEnter={(e) => {
            e.target.style.background = '#f0f0f0';
          }}
          onMouseLeave={(e) => {
            e.target.style.background = 'none';
          }}
        >
          🧮
        </button>
      ) : (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            background: '#fff',
            border: '1px solid #4caf50',
            borderRadius: '4px',
            padding: '2px 4px'
          }}
        >
          <input
            ref={inputRef}
            type="number"
            min="0"
            step={getInputStep(isMinuteUnit)}
            value={valueStr}
            onChange={(e) => setValueStr(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                commitIfValidThenClose();
              } else if (e.key === 'Escape') {
                e.preventDefault();
                closeAndClear();
              }
            }}
            style={{
              width: '60px',
              padding: '2px 4px',
              border: 'none',
              outline: 'none',
              fontSize: '13px',
              textAlign: 'center'
            }}
          />
          <button
            type="button"
            onClick={commitIfValidThenClose}
            style={{
              background: '#4caf50',
              color: '#fff',
              border: 'none',
              borderRadius: '3px',
              padding: '2px 6px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            ✓
          </button>
          <button
            type="button"
            onClick={closeAndClear}
            style={{
              background: '#f44336',
              color: '#fff',
              border: 'none',
              borderRadius: '3px',
              padding: '2px 6px',
              cursor: 'pointer',
              fontSize: '11px'
            }}
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
