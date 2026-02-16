// File: src/components/GroupTree.jsx
// Author: Cheng
// Description:
//   Recursive UI component for displaying and managing habits and habit groups.
//   Supports three item types:
//     - Simple habits with direct daily input
//     - Level-enabled habits with progress bars and level calculation
//     - Groups composed of child habits or subgroups
//   Includes logic for dropdown actions (edit, delete, level upgrade/downgrade),
//   nested rendering of child items, and progress input handling.
//   Evaluates completion status via evaluateCompletion() for visual feedback and progress display.

import { useEffect, useRef, useState } from 'react';

import { evaluateCompletion } from './evaluate';

function GroupTree({
  items,
  itemId,
  selectedDate,
  updateItem,
  deleteItem,
  setEditItem,
  openDropdownId,
  setOpenDropdownId
}) {
  const item = items[itemId];
  if (!item) return null;

  const {
    completed,
    level,
    mainLevelIndex,
    currentValue,
    requiredTarget,
    count,
    totalCount = 0,
    totalChildren = 0,
    nextLevelTotal = 0
  } = evaluateCompletion(items, itemId, selectedDate);

  const isLevelHabit = item.type === 'habit' && item.levelEnabled;
  const isHabit = item.type === 'habit';
  const isGroup = item.type === 'group';
  const showDropdown = openDropdownId === item.id;
  const dropdownRef = useRef(null);

  // --- Timer (for unit === 'minutes') ---
  const [isTiming, setIsTiming] = useState(false);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [countdown, setCountdown] = useState(0); // 倒数秒数

  const timerStartRef = useRef(null); // timestamp (ms)
  const timerIntervalRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // --- Calculator input ---
  const [showCalculator, setShowCalculator] = useState(false);
  const [calculatorValue, setCalculatorValue] = useState('');
  const calculatorInputRef = useRef(null);
  const calculatorRef = useRef(null);

  const isMinuteUnit = isHabit && String(item.unit || '').toLowerCase() === 'minutes';

  const mainLevelName = isLevelHabit ? item.mainLevels?.[mainLevelIndex] || item.name : '';

  const renderDropdownMenu = () => (
    <div
      ref={dropdownRef}
      className="dropdown"
      style={{
        position: 'absolute',
        width: '120px',
        top: '100%',
        right: 0,
        backgroundColor: '#fff',
        border: '1px solid #ccc',
        borderRadius: '4px',
        padding: '6px 8px',
        zIndex: 999,
        marginTop: '4px',
        boxShadow: '0 2px 6px rgba(0,0,0,0.1)'
      }}
    >
      <button
        style={{ padding: '4px 0' }}
        onClick={() => {
          setEditItem(item);
          setOpenDropdownId(null);
        }}
      >
        ✏️ Edit
      </button>

      {isLevelHabit && mainLevelIndex > 1 && (
        <button
          style={{ padding: '4px 0' }}
          onClick={() => {
            updateItem({
              ...item,
              currentMainLevel: mainLevelIndex + 1
            });
            setOpenDropdownId(null);
          }}
        >
          ⬆️ Upgrade
        </button>
      )}
      {isLevelHabit && mainLevelIndex > 1 && (
        <button
          style={{ padding: '4px 0' }}
          onClick={() => {
            updateItem({
              ...item,
              currentMainLevel: mainLevelIndex - 1
            });
            setOpenDropdownId(null);
          }}
        >
          ⬇️ Downgrade
        </button>
      )}

      <button
        style={{ padding: '4px 0' }}
        onClick={() => {
          if (confirm(`Delete "${item.name}"?`)) deleteItem(item.id);
          setOpenDropdownId(null);
        }}
      >
        🗑️ Delete
      </button>
    </div>
  );

  const getTodayValue = () => {
    return isLevelHabit
      ? (item.progressByMainLevel?.[mainLevelIndex]?.[selectedDate] ?? 0)
      : (item.progressByDate?.[selectedDate] ?? 0);
  };

  const setTodayValue = (newVal) => {
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
  };

  const stopTimerAndCommit = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }

    const secondsToAdd = elapsedSec; // ⭐ 直接用秒

    if (secondsToAdd > 0) {
      const current = Number(getTodayValue()) || 0;
      setTodayValue(current + secondsToAdd);
    }

    setElapsedSec(0);
    setCountdown(0);
    timerStartRef.current = null;
    setIsTiming(false);
  };

  const startCountdown = () => {
    setCountdown(5);
    setIsTiming(true); // 设置为计时状态，但实际计时还未开始
    
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }
    
    countdownIntervalRef.current = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          // 倒数结束，开始真正的计时
          const intervalId = countdownIntervalRef.current;
          if (intervalId) {
            clearInterval(intervalId);
            countdownIntervalRef.current = null;
          }
          // 开始计时
          setCountdown(0);
          setElapsedSec(0);
          timerStartRef.current = Date.now();

          timerIntervalRef.current = setInterval(() => {
            const start = timerStartRef.current || Date.now();
            const diffSec = Math.floor((Date.now() - start) / 1000);
            setElapsedSec(diffSec);
          }, 1000);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const toggleTimer = () => {
    if (!isMinuteUnit) return;

    if (isTiming) {
      // 如果正在倒数，取消倒数并停止
      if (countdown > 0) {
        if (countdownIntervalRef.current) {
          clearInterval(countdownIntervalRef.current);
          countdownIntervalRef.current = null;
        }
        setCountdown(0);
        setIsTiming(false);
        return;
      }
      // 如果正在计时，停止并保存
      stopTimerAndCommit();
      return;
    }

    // 点击开始，先倒数5秒
    startCountdown();
  };

  const formatSec = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
  };

  const addToValue = (amount) => {
    const current = Number(getTodayValue()) || 0;
    if (isMinuteUnit) {
      // For minute units, amount is in minutes, convert to seconds
      const secondsToAdd = amount * 60;
      setTodayValue(current + secondsToAdd);
    } else {
      // For other units, add directly
      setTodayValue(current + amount);
    }
  };

  const openCalculator = () => {
    const currentValue = getTodayValue();
    // Set initial value based on unit type
    if (isMinuteUnit) {
      setCalculatorValue(
        currentValue === '' || currentValue === 0 ? '' : (Number(currentValue) / 60).toFixed(1)
      );
    } else {
      setCalculatorValue(currentValue === '' || currentValue === 0 ? '' : String(currentValue));
    }
    setShowCalculator(true);
  };

  const handleCalculatorSubmit = () => {
    const num = parseFloat(calculatorValue);
    if (!isNaN(num) && num >= 0) {
      if (isMinuteUnit) {
        // Convert minutes to seconds
        const sec = Math.round(num * 60);
        setTodayValue(sec);
      } else {
        // Use the value directly for non-minute units
        setTodayValue(num);
      }
    }
    setShowCalculator(false);
    setCalculatorValue('');
  };

  const handleCalculatorCancel = () => {
    setShowCalculator(false);
    setCalculatorValue('');
  };

  const renderHabitInput = () => {
    const rawValue = isLevelHabit
      ? (item.progressByMainLevel?.[mainLevelIndex]?.[selectedDate] ?? '')
      : (item.progressByDate?.[selectedDate] ?? '');

    // For minute units, convert seconds to minutes for display
    // For other units, use the raw value directly
    const displayValue = isMinuteUnit
      ? rawValue === ''
        ? ''
        : (Number(rawValue) / 60).toFixed(1)
      : rawValue === ''
        ? ''
        : String(rawValue);

    return (
      <input
        type="number"
        min="0"
        step={isMinuteUnit ? '0.1' : '1'}
        placeholder="0"
        value={displayValue}
        readOnly
        style={{
          width: isMinuteUnit ? '55px' : '45px',
          padding: '2px 4px',
          border: 'none',
          borderRadius: '3px',
          fontSize: '13px',
          textAlign: 'center',
          backgroundColor: 'transparent',
          cursor: 'default',
          color: '#2196f3'
        }}
      />
    );
  };

  const renderHabitLine = () => {
    const label = isLevelHabit ? `${mainLevelName}` : `${item.name}`;

    const progressPercent =
      nextLevelTotal > 0 ? Math.min(100, Math.floor((totalCount / nextLevelTotal) * 100)) : 0;
    const status = completed ? '✅' : '☑️';

    return (
      <div style={{ position: 'relative', marginBottom: '8px' }}>
        {/* First row: Status + Label + Input + Unit, Timer, Calculator, Dropdown */}
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          {/* Left: Status + Label + Input + Unit */}
          <div
            style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: '1', minWidth: 0 }}
          >
            <span>{status}</span>
            <span>{label}</span>
            {renderHabitInput()}
            <span style={{ fontSize: '13px', color: '#555' }}>
              /{requiredTarget} {item.unit}
            </span>
            {isMinuteUnit && (
              <span style={{ fontSize: '11px', color: '#888' }}>
                ({formatSec(Number(getTodayValue()) || 0)})
              </span>
            )}
          </div>

          {/* Right: Timer, Calculator and dropdown */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {isMinuteUnit && (
              <button
                type="button"
                onClick={toggleTimer}
                title={isTiming ? (countdown > 0 ? `倒數 ${countdown} 秒後開始` : 'Stop timer') : 'Start timer (倒數5秒後開始)'}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: '4px',
                  padding: '2px 8px',
                  cursor: 'pointer',
                  background: countdown > 0 ? '#ff9800' : isTiming ? '#ffe9a8' : '#f5f5f5',
                  fontSize: '11px',
                  whiteSpace: 'nowrap',
                  transition: 'background 0.2s',
                  color: countdown > 0 ? '#fff' : 'inherit',
                  fontWeight: countdown > 0 ? 'bold' : 'normal'
                }}
              >
                ⏱️ {countdown > 0 ? `倒數 ${countdown}` : isTiming ? formatSec(elapsedSec) : 'Start'}
              </button>
            )}
            {/* Calculator button and input */}
            <div style={{ display: 'inline-block', position: 'relative' }} ref={calculatorRef}>
              {!showCalculator ? (
                <button
                  type="button"
                  onClick={openCalculator}
                  title="輸入數值 (Input value)"
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
                    ref={calculatorInputRef}
                    type="number"
                    min="0"
                    step={isMinuteUnit ? '0.1' : '1'}
                    value={calculatorValue}
                    onChange={(e) => setCalculatorValue(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleCalculatorSubmit();
                      } else if (e.key === 'Escape') {
                        e.preventDefault();
                        handleCalculatorCancel();
                      }
                    }}
                    autoFocus
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
                    onClick={handleCalculatorSubmit}
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
                    onClick={handleCalculatorCancel}
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
            {/* ▼ Dropdown trigger */}
            <div style={{ display: 'inline-block', position: 'relative' }}>
              <button
                onClick={() => setOpenDropdownId(showDropdown ? null : item.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: '2px 6px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                ⋮
              </button>

              {showDropdown && renderDropdownMenu()}
            </div>
          </div>
        </div>

        {/* Second row: Quick action buttons */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '3px', marginTop: '4px' }}>
          <button
            type="button"
            onClick={() => addToValue(10)}
            style={{
              border: '1px solid #4caf50',
              borderRadius: '3px',
              padding: '2px 5px',
              cursor: 'pointer',
              background: '#e8f5e9',
              fontSize: '10px',
              fontWeight: '500',
              color: '#2e7d32',
              minWidth: '28px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#c8e6c9';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#e8f5e9';
            }}
            title={`Add 10 ${item.unit || ''}`}
          >
            +10
          </button>
          <button
            type="button"
            onClick={() => addToValue(20)}
            style={{
              border: '1px solid #4caf50',
              borderRadius: '3px',
              padding: '2px 5px',
              cursor: 'pointer',
              background: '#e8f5e9',
              fontSize: '10px',
              fontWeight: '500',
              color: '#2e7d32',
              minWidth: '28px',
              transition: 'all 0.2s'
            }}
            onMouseEnter={(e) => {
              e.target.style.background = '#c8e6c9';
            }}
            onMouseLeave={(e) => {
              e.target.style.background = '#e8f5e9';
            }}
            title={`Add 20 ${item.unit || ''}`}
          >
            +20
          </button>
        </div>

        {isLevelHabit && (
          <div
            style={{
              marginTop: '6px',
              marginBottom: '4px',
              fontSize: '12px',
              color: '#666'
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>LV{level}</span>
              <span>
                {totalCount} / {nextLevelTotal}
              </span>
              <span>LV{level + 1}</span>
            </div>
            <div
              style={{
                height: '10px',
                background: '#e0e0e0',
                borderRadius: '5px',
                overflow: 'hidden',
                marginTop: '4px'
              }}
            >
              <div
                style={{
                  width: `${progressPercent}%`,
                  height: '100%',
                  background: '#4caf50',
                  transition: 'width 0.3s'
                }}
              />
            </div>
          </div>
        )}
      </div>
    );
  };

  const renderGroupLine = () => {
    return (
      <div>
        {completed ? '✅' : '☑️'} {item.name} ({count}/{totalChildren} required)
        {/* ▼ Dropdown trigger */}
        <div style={{ display: 'inline-block', position: 'relative' }}>
          <button
            onClick={() => setOpenDropdownId(showDropdown ? null : item.id)}
            style={{ display: 'block', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            ⋮
          </button>

          {showDropdown && renderDropdownMenu()}
        </div>
      </div>
    );
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpenDropdownId(null);
      }
    };

    if (showDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showDropdown]);

  useEffect(() => {
    return () => {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      if (countdownIntervalRef.current) clearInterval(countdownIntervalRef.current);
    };
  }, []);

  useEffect(() => {
    if (isTiming || countdown > 0) {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      stopTimerAndCommit();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [itemId, selectedDate]);

  // Auto focus calculator input when opened
  useEffect(() => {
    if (showCalculator && calculatorInputRef.current) {
      calculatorInputRef.current.focus();
      calculatorInputRef.current.select();
    }
  }, [showCalculator]);

  // Handle click outside calculator
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        calculatorRef.current &&
        !calculatorRef.current.contains(event.target) &&
        showCalculator
      ) {
        const num = parseFloat(calculatorValue);
        if (!isNaN(num) && num >= 0) {
          if (isMinuteUnit) {
            const sec = Math.round(num * 60);
            setTodayValue(sec);
          } else {
            setTodayValue(num);
          }
        }
        setShowCalculator(false);
        setCalculatorValue('');
      }
    };

    if (showCalculator) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showCalculator, calculatorValue]);

  return (
    <div
      style={{
        backgroundColor: 'rgb(197, 241, 198)',
        marginLeft: '0px',
        borderLeft: '2px solid #ccc',
        borderRadius: '5px',
        paddingLeft: '10px',
        marginBottom: '10px'
      }}
    >
      {isGroup && renderGroupLine()}
      {isHabit && renderHabitLine()}

      {isGroup &&
        item.children.map((childId) => (
          <GroupTree
            key={childId}
            items={items}
            itemId={childId}
            selectedDate={selectedDate}
            updateItem={updateItem}
            deleteItem={deleteItem}
            setEditItem={setEditItem}
            openDropdownId={openDropdownId}
            setOpenDropdownId={setOpenDropdownId}
          />
        ))}
    </div>
  );
}

export default GroupTree;
