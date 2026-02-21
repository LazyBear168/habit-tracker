// File: src/views/MainView.jsx
// Author: Cheng
// Description:
//   Main daily view for habit tracking. Displays a list of top-level habit groups,
//   each rendered via the GroupTree component. Users can navigate between days
//   using date controls, view or manage habit items, and perform CRUD operations.
//   Designed to be the default user interface for daily habit interaction.
//
// Optimization goals (2026-02-21):
//   ✅ Persist ONLY filters to Firestore (users/{uid}/ui/mainView)
//   ✅ Do NOT persist viewFilter (switching All / filter buttons won't write)
//   ✅ Debounced + deduped writes (write only when filters truly changed)
//   ✅ Stable keys for filter buttons (id = itemId) to prevent flicker
//   ✅ Avoid invalid hook order / early-return issues

import GroupTree from '../components/GroupTree';
import AddFilterModal from '../components/AddFilterModal';
import { useEffect, useMemo, useRef, useState } from 'react';
import { db } from '../firebase';
import { doc, onSnapshot, setDoc, serverTimestamp } from 'firebase/firestore';

export default function MainView({
  userId,
  items,
  selectedDate,
  setSelectedDate,
  updateItem,
  deleteItem,
  setEditItem,
  goToPreviousDay,
  goToNextDay,
  openDropdownId,
  setOpenDropdownId
}) {
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [collapsedMap, setCollapsedMap] = useState({});
  const [viewFilter, setViewFilter] = useState('all'); // local only (NOT persisted)
  const [filters, setFilters] = useState([]); // [{ id: itemId, itemId }]
  const uiHydratingRef = useRef(true);

  // Persist only filters: debounce + dedupe
  const lastFiltersRef = useRef(''); // JSON string of sorted itemIds
  const writeTimerRef = useRef(null);

  const topLevelItems = useMemo(() => {
    const allChildren = Object.values(items)
      .filter((i) => i.type === 'group')
      .flatMap((g) => g.children || []);
    return Object.values(items).filter((item) => !allChildren.includes(item.id));
  }, [items]);

  // 1) Read UI config (filters only) from Firestore
  useEffect(() => {
    if (!userId) return;

    const ref = doc(db, `users/${userId}/ui`, 'mainView');

    const unsub = onSnapshot(
      ref,
      async (snap) => {
        if (!snap.exists()) {
          // First login: set defaults locally, then create doc once
          setFilters([]);
          setViewFilter('all');

          try {
            await setDoc(ref, { filters: [], updatedAt: serverTimestamp() }, { merge: true });
            lastFiltersRef.current = JSON.stringify([]); // keep dedupe in sync
          } catch (e) {
            console.error('🔥 init ui/mainView failed:', e.code, e.message);
          } finally {
            uiHydratingRef.current = false;
          }
          return;
        }

        const data = snap.data() || {};
        const itemIds = Array.isArray(data.filters) ? data.filters : [];

        // Stable keys: id = itemId
        setFilters(itemIds.map((itemId) => ({ id: itemId, itemId })));

        // viewFilter is local only; reset to All on login/device switch
        setViewFilter('all');

        // keep dedupe ref aligned to avoid immediate re-write
        const sorted = Array.from(new Set(itemIds)).sort();
        lastFiltersRef.current = JSON.stringify(sorted);

        uiHydratingRef.current = false;
      },
      (err) => {
        console.error('🔥 ui/mainView onSnapshot error:', err.code, err.message);
        uiHydratingRef.current = false;
      }
    );

    return () => unsub();
  }, [userId]);

  // 2) Clean up filters when items/topLevelItems change (after hydration)
  //    - Remove filters that no longer exist as top-level items
  //    - Ensure viewFilter points to existing item, else fallback to 'all'
  //    - Do NOT set lastFiltersRef here: let effect #3 persist cleaned list (one write)
  useEffect(() => {
    if (uiHydratingRef.current) return;
    if (!items || Object.keys(items).length === 0) return;

    const topLevelIdSet = new Set(topLevelItems.map((x) => x.id));

    setFilters((prev) => {
      const next = prev.filter((f) => topLevelIdSet.has(f.itemId));
      return next;
    });

    setViewFilter((curr) => {
      if (curr === 'all') return curr;
      return items[curr] ? curr : 'all';
    });
  }, [topLevelItems, items]);

  // 3) Write ONLY filters back to Firestore (debounced + deduped)
  useEffect(() => {
    if (!userId) return;
    if (uiHydratingRef.current) return;

    const itemIds = Array.from(new Set(filters.map((f) => f.itemId))).sort();
    const payloadStr = JSON.stringify(itemIds);

    if (payloadStr === lastFiltersRef.current) return;

    if (writeTimerRef.current) clearTimeout(writeTimerRef.current);

    writeTimerRef.current = setTimeout(() => {
      const ref = doc(db, `users/${userId}/ui`, 'mainView');

      setDoc(ref, { filters: itemIds, updatedAt: serverTimestamp() }, { merge: true })
        .then(() => {
          lastFiltersRef.current = payloadStr;
        })
        .catch((e) => {
          console.error('🔥 write filters failed:', e.code, e.message);
        });
    }, 600);

    return () => {
      if (writeTimerRef.current) clearTimeout(writeTimerRef.current);
    };
  }, [userId, filters]);

  const visibleItems = useMemo(() => {
    if (viewFilter === 'all') return topLevelItems;
    const it = items[viewFilter];
    return it ? [it] : [];
  }, [items, topLevelItems, viewFilter]);

  return (
    <>
      {/* Date navigation header */}
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 90,
          background: '#f8f9f5',
          padding: '8px',
          display: 'flex',
          justifyContent: 'center',
          gap: '0px'
        }}
      >
        <button
          style={{ display: 'block', background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={goToPreviousDay}
        >
          ◀
        </button>
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        <button
          style={{ display: 'block', background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={goToNextDay}
        >
          ▶
        </button>
      </div>

      {/* Filter bar */}
      <div
        style={{
          display: 'flex',
          gap: '6px',
          overflowX: 'auto',
          padding: '6px 8px',
          maxWidth: '500px',
          margin: '0 auto'
        }}
      >
        <button
          onClick={() => setViewFilter('all')}
          style={{
            padding: '4px 10px',
            borderRadius: '12px',
            border: viewFilter === 'all' ? '1px solid #333' : '1px solid #ccc',
            background: viewFilter === 'all' ? '#eaeaea' : '#fff',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          All
        </button>

        {filters.map((f) => {
          const it = items[f.itemId];
          if (!it) return null;

          const active =
            viewFilter === f.itemId ||
            (it.type === 'group' && (it.children || []).some((cid) => cid === viewFilter));

          return (
            <button
              key={f.id} // ✅ stable (id=itemId)
              onClick={() => {
                const target = items[f.itemId];
                if (!target) return;

                // group: show the group itself (and auto-expand it)
                if (target.type === 'group') {
                  setViewFilter(target.id);
                  setCollapsedMap((prev) => ({ ...prev, [target.id]: false }));
                  return;
                }
                setViewFilter(target.id);
              }}
              style={{
                padding: '4px 10px',
                borderRadius: '12px',
                border: active ? '1px solid #333' : '1px solid #ccc',
                background: active ? '#eaeaea' : '#fff',
                cursor: 'pointer',
                whiteSpace: 'nowrap'
              }}
            >
              {it.name}
            </button>
          );
        })}

        <button
          onClick={() => {
            if (topLevelItems.length === 0) return;
            setShowFilterModal(true);
          }}
          style={{
            padding: '4px 10px',
            borderRadius: '12px',
            border: '1px dashed #aaa',
            background: '#fff',
            cursor: 'pointer',
            whiteSpace: 'nowrap'
          }}
        >
          ＋
        </button>
      </div>

      {/* Main content */}
      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        {visibleItems.map((item) => (
          <GroupTree
            key={item.id}
            items={items}
            itemId={item.id}
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

      {/* Add / Remove filters modal */}
      <AddFilterModal
        open={showFilterModal}
        topLevelItems={topLevelItems}
        filters={filters}
        onCancel={() => setShowFilterModal(false)}
        onToggleItem={(id) => {
          setFilters((prev) => {
            const exists = prev.some((f) => f.itemId === id);
            if (exists) {
              // remove
              return prev.filter((f) => f.itemId !== id);
            }
            // add (stable id)
            return [...prev, { id, itemId: id }];
          });

          // ✅ We DO NOT persist viewFilter; also avoid auto-switching views here.
          // If you want to auto-switch to the newly added filter, uncomment below:
          // setViewFilter(id);

          const it = items[id];
          if (it?.type === 'group') {
            setCollapsedMap((prev) => ({ ...prev, [id]: false }));
          }
        }}
      />
    </>
  );
}
