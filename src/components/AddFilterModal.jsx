// File: src/components/AddFilterModal.jsx
import { useEffect, useMemo } from 'react';

export default function AddFilterModal({ open, topLevelItems, filters, onCancel, onToggleItem }) {
  // ESC 關閉
  useEffect(() => {
    if (!open) return;
    const onKeyDown = (e) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  const filterSet = useMemo(() => new Set(filters.map((f) => f.itemId)), [filters]);

  const { groups, habits } = useMemo(() => {
    const groups = topLevelItems.filter((x) => x.type === 'group');
    const habits = topLevelItems.filter((x) => x.type === 'habit');
    return { groups, habits };
  }, [topLevelItems]);

  if (!open) return null;

  const Row = ({ it }) => {
    const added = filterSet.has(it.id);

    return (
      <div
        onClick={() => {
          // 點整列就 toggle 這個 item
          onToggleItem(it.id);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '10px 10px',
          borderRadius: '10px',
          cursor: 'pointer',
          background: 'transparent'
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', minWidth: 0 }}>
          <div style={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {it.name}
          </div>
          <div style={{ fontSize: '12px', color: '#777' }}>{it.type}</div>
        </div>

        {/* 右側：已加入顯示 ✕，未加入顯示 + */}
        {added ? (
          <button
            title="Remove"
            onClick={(e) => {
              e.stopPropagation();
              onToggleItem(it.id);
            }}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '18px',
              lineHeight: '18px',
              padding: '6px',
              color: '#666'
            }}
          >
            ×
          </button>
        ) : (
          <button
            title="Add"
            onClick={(e) => {
              e.stopPropagation();
              onToggleItem(it.id);
            }}
            style={{
              border: '1px solid #ccc',
              background: '#fff',
              cursor: 'pointer',
              borderRadius: '10px',
              padding: '4px 10px'
            }}
          >
            +
          </button>
        )}
      </div>
    );
  };

  return (
    <div
      onClick={onCancel}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.35)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 9999
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(520px, 100vw)',
          background: '#fff',
          borderRadius: '16px',
          maxHeight: '70vh', // 保留也行
          padding: '12px',
          boxShadow: '0 -8px 30px rgba(0,0,0,0.2)',
          overflow: 'hidden'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ fontWeight: 800 }}>Manage Filters</div>
          <button
            onClick={onCancel}
            style={{
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              fontSize: '18px'
            }}
            title="Close"
          >
            ✕
          </button>
        </div>

        <div
          style={{
            marginTop: '10px',
            overflowY: 'auto',
            maxHeight: '60vh',
            paddingRight: '4px'
          }}
        >
          {groups.length > 0 && (
            <>
              <div style={{ fontSize: '12px', color: '#777', margin: '8px 4px' }}>Groups</div>
              <div style={{ display: 'grid', gap: '6px' }}>
                {groups.map((g) => (
                  <Row key={g.id} it={g} />
                ))}
              </div>
            </>
          )}

          {habits.length > 0 && (
            <>
              <div style={{ fontSize: '12px', color: '#777', margin: '12px 4px 8px' }}>Habits</div>
              <div style={{ display: 'grid', gap: '6px' }}>
                {habits.map((h) => (
                  <Row key={h.id} it={h} />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
