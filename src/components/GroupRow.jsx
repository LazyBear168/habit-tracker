// File: src/components/GroupRow.jsx
// Description: UI row for a group item (collapse + progress background + optional level bar + dropdown)

import { useRef } from 'react';
import { useClickOutside } from '../hooks/useClickOutside';

function DropdownMenu({ dropdownRef, onEdit, onDelete }) {
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

      <button style={{ padding: '4px 0' }} onClick={onDelete}>
        🗑️ Delete
      </button>
    </div>
  );
}

export default function GroupRow({
  item,
  // evaluateCompletion results
  completed,
  level,
  count,
  totalChildren,
  totalCount,
  nextLevelTotal,
  // group state
  isCollapsed,
  isLevelGroup,
  onToggleCollapse,

  // dropdown control (from parent like GroupTree)
  openDropdownId,
  setOpenDropdownId,
  onEdit,
  onDelete
}) {
  const showDropdown = openDropdownId === item.id;
  const dropdownRef = useRef(null);

  useClickOutside(dropdownRef, () => setOpenDropdownId(null), showDropdown);

  const progressPercent =
    nextLevelTotal > 0 ? Math.min(100, Math.floor((totalCount / nextLevelTotal) * 100)) : 0;

  const requiredCount = Number(item.targetCount ?? totalChildren ?? 0);
  const safeTarget = Math.max(1, requiredCount);
  const groupDayPercent = Math.min(100, Math.floor((count / safeTarget) * 100));

  const bg = isCollapsed
    ? `linear-gradient(
      90deg,
      ${completed ? '#c8e6c9' : '#d9f2dc'} 0%,
      ${completed ? '#c8e6c9' : '#d9f2dc'} ${groupDayPercent}%,
      #eef7ee ${groupDayPercent}%,
      #eef7ee 100%
    )`
    : '#eef7ee'; // 展開時：不要背景進度，只給底色

  const closeDropdown = () => setOpenDropdownId(null);

  const handleEdit = () => {
    onEdit?.();
    closeDropdown();
  };

  const handleDelete = () => {
    onDelete?.();
    closeDropdown();
  };

  return (
    <div
      style={{
        position: 'relative',
        marginBottom: '8px',
        padding: '6px 8px',
        borderRadius: '8px',
        background: bg,
        transition: 'background 0.25s'
      }}
    >
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
            {item.name} ({count}/{requiredCount} required)
          </span>
          <span style={{ fontSize: '12px', color: '#666' }}>LV{level}</span>
        </div>

        {/* Right controls: collapse + dropdown */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
          <button
            type="button"
            onClick={onToggleCollapse}
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

          <div style={{ display: 'inline-block', position: 'relative' }}>
            <button
              type="button"
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
              title="Menu"
            >
              ⋮
            </button>

            {showDropdown && (
              <DropdownMenu dropdownRef={dropdownRef} onEdit={handleEdit} onDelete={handleDelete} />
            )}
          </div>
        </div>
      </div>

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
}
