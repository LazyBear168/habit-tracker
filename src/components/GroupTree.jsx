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

  const timerStartRef = useRef(null);   // timestamp (ms)
  const timerIntervalRef = useRef(null);

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

       
    {isLevelHabit && mainLevelIndex > 0 && (
      <button
        style={{ padding: '4px 0' }}
        onClick={() => {
          updateItem({ ...item, currentMainLevel: mainLevelIndex - 1 });
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
      ? item.progressByMainLevel?.[mainLevelIndex]?.[selectedDate] ?? 0
      : item.progressByDate?.[selectedDate] ?? 0;
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

  const secondsToAdd = elapsedSec; // ⭐ 直接用秒

  if (secondsToAdd > 0) {
    const current = Number(getTodayValue()) || 0;
    setTodayValue(current + secondsToAdd);
  }

  setElapsedSec(0);
  timerStartRef.current = null;
  setIsTiming(false);
};


  const toggleTimer = () => {
    if (!isMinuteUnit) return;

    if (isTiming) {
      stopTimerAndCommit();
      return;
    }

    // start
    setIsTiming(true);
    setElapsedSec(0);
    timerStartRef.current = Date.now();

    timerIntervalRef.current = setInterval(() => {
      const start = timerStartRef.current || Date.now();
      const diffSec = Math.floor((Date.now() - start) / 1000);
      setElapsedSec(diffSec);
    }, 1000);
  };

  const formatSec = (sec) => {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
  };


  const renderHabitInput = () => {
    const rawSec = isLevelHabit
  ? item.progressByMainLevel?.[mainLevelIndex]?.[selectedDate] ?? 0
  : item.progressByDate?.[selectedDate] ?? 0;

  // UI 給人看的「分鐘」
  const displayMinutes = rawSec ? (rawSec / 60).toFixed(1) : '';



    return (
      <input
        type="number"
        min="0"
        step="0.1"
        placeholder="0"
        value={displayMinutes === '' ? '' : String(displayMinutes)}
        onChange={(e) => {
          const mins = parseFloat(e.target.value);
          const sec = isNaN(mins) ? 0 : Math.round(mins * 60);
          setTodayValue(sec);
        }}
        style={{ width: '60px' }}
      />

    );
  };

  const renderHabitLine = () => {
    const label = isLevelHabit ? `${mainLevelName}` : `${item.name}: `;

    const progressPercent =
      nextLevelTotal > 0 ? Math.min(100, Math.floor((totalCount / nextLevelTotal) * 100)) : 0;
    const status = completed ? '✅' : '☑️';

    return (
      <div style={{ position: 'relative', marginBottom: '8px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            {status} {label}
          </div>
          <div
            style={{
              width: '160px',
              display: 'flex',
              alignItems: 'left',
              justifyContent: 'space-between',
              gap: '6px'
            }}
          >
            {renderHabitInput()} /{requiredTarget} {item.unit}

            {isMinuteUnit && (
              <span style={{ fontSize: '12px', color: '#666' }}>
                ({formatSec(Number(getTodayValue()) || 0)})
              </span>
            )}

            {isMinuteUnit && (
              <button
                type="button"
                onClick={toggleTimer}
                title={isTiming ? 'Stop timer' : 'Start timer'}
                style={{
                  marginLeft: '6px',
                  border: '1px solid #ccc',
                  borderRadius: '6px',
                  padding: '2px 6px',
                  cursor: 'pointer',
                  background: isTiming ? '#ffe9a8' : '#fff'
                }}
              >
                ⏱️ {isTiming ? formatSec(elapsedSec) : 'Start'}
              </button>
            )}

            {/* ▼ Dropdown trigger */}
            <div style={{ display: 'inline-block', position: 'relative' }}>
              <button
                onClick={() => setOpenDropdownId(showDropdown ? null : item.id)}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  fontSize: '16px',
                  padding: '2px 6px'
                }}
              >
                ⋮
              </button>

              {showDropdown && renderDropdownMenu()}
            </div>
          </div>
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
  };
  }, []);

  useEffect(() => {
  if (isTiming) stopTimerAndCommit();
  // eslint-disable-next-line react-hooks/exhaustive-deps
} , [itemId, selectedDate]);



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
