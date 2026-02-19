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

import { useRef, useState } from 'react';

import { evaluateCompletion } from './evaluate';
import { useClickOutside } from '../hooks/useClickOutside';
import { useBoundHabitTimer } from '../hooks/useBoundHabitTimer';

import HabitValueCalculator from './HabitValueCalculator';

import { useHabitValue } from '../hooks/useHabitValue';

import { useHabitValueAtTarget } from '../hooks/useHabitValueAtTarget';
import { formatSec } from '../utils/formatSec';

const QUICK_ADD_BASE_STYLE = {
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
};

const QUICK_ADD_HOVER_STYLE = {
  background: '#c8e6c9'
};

function GroupTree({
  items,
  itemId,
  selectedDate,
  updateItem,
  deleteItem,
  setEditItem,
  openDropdownId,
  setOpenDropdownId,
  collapsedMap,
  setCollapsedMap
}) {
  const item = items[itemId];
  if (!item) return null;

  const {
    completed,
    level,
    mainLevelIndex,
    requiredTarget,
    count,
    totalCount = 0,
    totalChildren = 0,
    nextLevelTotal = 0
  } = evaluateCompletion(items, itemId, selectedDate);

  const isLevelHabit = item.type === 'habit' && item.levelEnabled;
  const isLevelGroup = item.type === 'group' && item.levelEnabled;
  const isHabit = item.type === 'habit';
  const isGroup = item.type === 'group';
  const isCollapsed = isGroup ? (collapsedMap?.[item.id] ?? true) : false;

  const toggleCollapse = () => {
    if (!isGroup) return;
    setCollapsedMap((prev) => {
      const prevMap = prev || {};
      const current = prevMap[item.id] ?? true; // 預設收合
      return {
        ...prevMap,
        [item.id]: !current
      };
    });
  };

  const showDropdown = openDropdownId === item.id;
  const dropdownRef = useRef(null);

  const isMinuteUnit = isHabit && String(item.unit || '').toLowerCase() === 'minutes';

  const { rawValue, setRawValue, displayValue, inputStep, addDisplayValue } = useHabitValue({
    item,
    selectedDate,
    updateItem,
    isLevelHabit,
    mainLevelIndex,
    isMinuteUnit
  });

  const mainLevelName = isLevelHabit ? item.mainLevels?.[mainLevelIndex] || item.name : '';

  const closeDropdown = () => setOpenDropdownId(null);

  const onEdit = () => {
    setEditItem(item);
    closeDropdown();
  };

  const onDelete = () => {
    if (confirm(`Delete "${item.name}"?`)) deleteItem(item.id);
    closeDropdown();
  };

  const mainLevelsLength = item.mainLevels?.length ?? 0;

  const onUpgrade = () => {
    updateItem({ ...item, currentMainLevel: mainLevelIndex + 1 });
    closeDropdown();
  };

  const onDowngrade = () => {
    updateItem({ ...item, currentMainLevel: mainLevelIndex - 1 });
    closeDropdown();
  };

  const dropdownMenuProps = {
    item,
    isLevelHabit,
    mainLevelIndex,
    mainLevelsLength,
    onEdit,
    onDelete,
    onUpgrade,
    onDowngrade
  };

  useClickOutside(dropdownRef, () => setOpenDropdownId(null), showDropdown);

  const habitValueAtTarget = useHabitValueAtTarget({ items, updateItem });

  const timer = useBoundHabitTimer({
    enabled: isMinuteUnit,
    countdownSeconds: 5,

    getBindTarget: () => ({
      itemId: item.id,
      date: selectedDate,
      isLevelHabit,
      mainLevelIndex
    }),

    getCurrentValueAtTarget: habitValueAtTarget.getRawValueAtTarget,
    commitValueAtTarget: habitValueAtTarget.setRawValueAtTarget
  });

  const isTiming = timer.isTiming;
  const countdown = timer.countdown;
  const elapsedSec = timer.elapsedSec;
  const formatSec = timer.formatSec;

  const renderHabitInput = () => {
    return (
      <input
        type="number"
        min="0"
        step={inputStep}
        placeholder="0"
        value={displayValue}
        readOnly
        style={{
          width: '40px',
          padding: '0px 0px',
          border: 'none',
          fontSize: '13px',
          textAlign: 'right',
          backgroundColor: 'transparent',
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
            <div style={{ display: 'inline-flex', alignItems: 'baseline' }}>
              {renderHabitInput()}
              <span style={{ fontSize: '13px', color: '#555' }}>
                /{requiredTarget} {item.unit}
              </span>
            </div>

            {isMinuteUnit && (
              <span style={{ fontSize: '11px', color: '#888' }}>
                ({formatSec(Number(rawValue) || 0)})
              </span>
            )}
            <span style={{ fontSize: '12px', color: '#666' }}>LV{level}</span>
          </div>

          {/* Right: Dropdown only */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
            {/* ▼ Dropdown trigger */}
            <DropdownTrigger
              itemId={item.id}
              show={showDropdown}
              dropdownRef={dropdownRef}
              onToggle={() => setOpenDropdownId(showDropdown ? null : item.id)}
              menuProps={dropdownMenuProps}
              buttonStyle={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '2px 6px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            />
          </div>
        </div>

        {/* Second row: Quick action buttons, Timer, Calculator */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'flex-end',
            gap: '6px',
            marginTop: '4px'
          }}
        >
          <QuickAddButtons values={[5, 10, 20]} unit={item.unit} onAdd={addDisplayValue} />

          {isMinuteUnit && (
            <button
              type="button"
              onClick={timer.toggleBound}
              title={
                isTiming
                  ? countdown > 0
                    ? `倒數 ${countdown} 秒後開始`
                    : 'Stop timer'
                  : 'Start timer (倒數5秒後開始)'
              }
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
          <HabitValueCalculator
            isMinuteUnit={isMinuteUnit}
            rawValue={rawValue}
            commitRawValue={setRawValue}
          />
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
                {isMinuteUnit
                  ? `${formatSec(totalCount)} / ${formatSec(nextLevelTotal)}`
                  : `${totalCount} / ${nextLevelTotal}`}
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
    const progressPercent =
      nextLevelTotal > 0 ? Math.min(100, Math.floor((totalCount / nextLevelTotal) * 100)) : 0;

    return (
      <div style={{ marginBottom: '8px' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: '8px'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0 }}>
            <span>{completed ? '✅' : '☑️'}</span>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {item.name} ({count}/{totalChildren} required)
            </span>
            <span style={{ fontSize: '12px', color: '#666' }}>LV{level}</span>
          </div>

          {/* Right: ⋮ + collapse toggle */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
            <DropdownTrigger
              show={showDropdown}
              onToggle={() => setOpenDropdownId(showDropdown ? null : item.id)}
              dropdownRef={dropdownRef}
              menuProps={dropdownMenuProps}
              buttonStyle={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '2px 6px'
              }}
            />

            <button
              type="button"
              onClick={toggleCollapse}
              title={isCollapsed ? 'Expand' : 'Collapse'}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                fontSize: '16px',
                padding: '2px 6px',
                transform: isCollapsed ? 'rotate(-90deg)' : 'rotate(0deg)',
                transition: 'transform 0.15s'
              }}
            >
              ▾
            </button>
          </div>
        </div>

        {/* NEW: group level progress bar */}
        {isLevelGroup && isCollapsed && (
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
                <span style={{ marginLeft: '6px', fontSize: '11px', color: '#888' }}>
                  ({String(item.levelStrategy || 'min')})
                </span>
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
        !isCollapsed &&
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
            collapsedMap={collapsedMap}
            setCollapsedMap={setCollapsedMap}
          />
        ))}
    </div>
  );
}

function QuickAddButtons({ values, unit, onAdd }) {
  const [hover, setHover] = useState(null);

  return (
    <>
      {values.map((n) => (
        <button
          key={n}
          type="button"
          onClick={() => onAdd(n)}
          style={{
            ...QUICK_ADD_BASE_STYLE,
            ...(hover === n ? QUICK_ADD_HOVER_STYLE : null)
          }}
          onMouseEnter={() => setHover(n)}
          onMouseLeave={() => setHover(null)}
          title={`Add ${n} ${unit || ''}`}
        >
          +{n}
        </button>
      ))}
    </>
  );
}

function DropdownTrigger({ show, onToggle, dropdownRef, menuProps, buttonStyle }) {
  return (
    <div style={{ display: 'inline-block', position: 'relative' }}>
      <button onClick={onToggle} style={buttonStyle}>
        ⋮
      </button>

      {show && <DropdownMenu dropdownRef={dropdownRef} {...menuProps} />}
    </div>
  );
}

function DropdownMenu({
  dropdownRef,
  item,
  isLevelHabit,
  mainLevelIndex,
  mainLevelsLength,
  onEdit,
  onDelete,
  onUpgrade,
  onDowngrade
}) {
  const canUpgrade = isLevelHabit && mainLevelsLength > 0 && mainLevelIndex < mainLevelsLength - 1;
  const canDowngrade = isLevelHabit && mainLevelsLength > 0 && mainLevelIndex > 0;

  return (
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
      <button style={{ padding: '4px 0' }} onClick={onEdit}>
        ✏️ Edit
      </button>

      {canUpgrade && (
        <button style={{ padding: '4px 0' }} onClick={onUpgrade}>
          ⬆️ Upgrade
        </button>
      )}

      {canDowngrade && (
        <button style={{ padding: '4px 0' }} onClick={onDowngrade}>
          ⬇️ Downgrade
        </button>
      )}

      <button style={{ padding: '4px 0' }} onClick={onDelete}>
        🗑️ Delete
      </button>
    </div>
  );
}

export default GroupTree;
