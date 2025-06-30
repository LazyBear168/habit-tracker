//Filename: src/components/GroupTree.jsx
import { useEffect, useRef } from 'react';

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
          setShowDropdown(false);
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
            setShowDropdown(false);
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
            setShowDropdown(false);
          }}
        >
          ⬇️ Downgrade
        </button>
      )}

      <button
        style={{ padding: '4px 0' }}
        onClick={() => {
          if (confirm(`Delete "${item.name}"?`)) {
            deleteItem(item.id);
          }
          setShowDropdown(false);
        }}
      >
        🗑️ Delete
      </button>
    </div>
  );

  const renderHabitInput = () => {
    const value = isLevelHabit
      ? item.progressByMainLevel?.[mainLevelIndex]?.[selectedDate] ?? ''
      : item.progressByDate?.[selectedDate] ?? '';

    return (
      <input
        type="number"
        min="0"
        placeholder="0" // Light gray text when empty
        value={value === '' ? '' : String(value)} // Show nothing if empty
        onChange={(e) => {
          const num = parseFloat(e.target.value);
          if (isLevelHabit) {
            updateItem({
              ...item,
              progressByMainLevel: {
                ...item.progressByMainLevel,
                [mainLevelIndex]: {
                  ...(item.progressByMainLevel?.[mainLevelIndex] || {}),
                  [selectedDate]: isNaN(num) ? 0 : num
                }
              }
            });
          } else {
            updateItem({
              ...item,
              progressByDate: {
                ...item.progressByDate,
                [selectedDate]: isNaN(num) ? 0 : num
              }
            });
          }
        }}
        style={{ width: '40px' }}
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
