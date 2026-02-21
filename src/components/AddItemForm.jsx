// File: src/components/AddItemForm.jsx
// Author: Cheng
// Description:
//   Reusable form component for creating or editing habits and groups.
//   Supports both "habit" and "group" item types with dynamic fields based on type.
//   Handles input for habit tracking details (e.g., unit, goal, dates),
//   level configuration, and group hierarchy. On submit, the item is created or updated
//   and synced to Firestore via the provided updateItem function.

import { useState } from 'react';
import { v4 as uuidv4 } from 'uuid';

const UNIT_OPTIONS = [
  'reps',
  'minutes',
  'hours',
  'km',
  'm',
  'steps',
  'pages',
  'kcal',
  'cups',
  'sets'
];

function wouldCreateCycle(items, parentId, nextChildren) {
  // DFS: from each child, walk down group children.
  // If we can reach parentId, then cycle exists.
  const stack = [...(nextChildren || [])];
  const visited = new Set();

  while (stack.length) {
    const cur = stack.pop();
    if (!cur) continue;
    if (cur === parentId) return true;
    if (visited.has(cur)) continue;
    visited.add(cur);

    const node = items[cur];
    if (node?.type === 'group' && Array.isArray(node.children)) {
      stack.push(...node.children);
    }
  }
  return false;
}

function findOtherParentGroup(items, childId, selfGroupId) {
  return Object.values(items).find(
    (g) =>
      g.type === 'group' &&
      g.id !== selfGroupId &&
      Array.isArray(g.children) &&
      g.children.includes(childId)
  );
}

function AddItemForm({ items, updateItem, editItem = null, onClose }) {
  const isEdit = !!editItem;

  const [type, setType] = useState(editItem?.type || 'habit');
  const [formId, setFormId] = useState(editItem?.id || uuidv4());

  const [name, setName] = useState(editItem?.name || '');
  const [unit, setUnit] = useState(editItem?.unit || '');
  const [dailyGoal, setDailyGoal] = useState(editItem?.dailyGoal || '');
  const [isDaily, setIsDaily] = useState(editItem?.isDaily ?? true);
  const [startDate, setStartDate] = useState(editItem?.startDate || '');
  const [endDate, setEndDate] = useState(editItem?.endDate || '');
  const [levelEnabled, setLevelEnabled] = useState(editItem?.levelEnabled || false);
  const [levelThreshold, setLevelThreshold] = useState(editItem?.levelThreshold || '');
  const [levelMultiplier, setLevelMultiplier] = useState(editItem?.levelMultiplier || '');
  const [mainLevels, setMainLevels] = useState(editItem?.mainLevels?.join(', ') || '');
  const [children, setChildren] = useState(editItem?.children || []);
  const [targetCount, setTargetCount] = useState(editItem?.targetCount || 1);
  const [levelStrategy, setLevelStrategy] = useState(editItem?.levelStrategy || 'max');

  const [parentGroup, setParentGroup] = useState(() => {
    if (!editItem || editItem.type !== 'habit') return '';
    const foundGroup = Object.values(items).find(
      (g) => g.type === 'group' && g.children?.includes(editItem.id)
    );
    return foundGroup?.id || '';
  });

  // Only enforce "single parent group" rule if you want.
  // If false: allow an item to be in multiple groups.
  const ENFORCE_SINGLE_PARENT_GROUP = true;

  const selectableChildren = Object.values(items)
    .filter((i) => i.id !== formId) // prevent self
    .map((it) => {
      // Cycle check: if we add "it.id" into this group's children, would it create a cycle?
      const wouldCycle = it.type === 'group' && wouldCreateCycle(items, formId, [it.id]);

      // Single-parent check: is it already inside another group?
      const otherParent = ENFORCE_SINGLE_PARENT_GROUP
        ? findOtherParentGroup(items, it.id, formId)
        : null;

      const disabled = wouldCycle || !!otherParent;

      let reason = '';
      if (wouldCycle) reason = 'cycle';
      else if (otherParent) reason = `already in "${otherParent.name}"`;

      return { it, disabled, reason };
    });

  const handleSubmit = async (e) => {
    e.preventDefault();

    const newItem = {
      ...(editItem || {}),
      id: formId,
      type,
      name,
      levelEnabled
    };
    if (type === 'habit') {
      newItem.unit = unit;
      newItem.dailyGoal = Number(dailyGoal);
      newItem.startDate = startDate;
      newItem.endDate = endDate || null;

      // Only initialize progress fields if not already set (i.e., on creation)
      if (!isEdit) {
        newItem.progressByDate = {};
        newItem.currentMainLevel = 0;
        newItem.progressByMainLevel = { 0: {} };
      }

      if (levelEnabled) {
        newItem.levelThreshold = Number(levelThreshold);
        newItem.levelMultiplier = Number(levelMultiplier);
        newItem.mainLevels = mainLevels
          .split(',')
          .map((l) => l.trim())
          .filter(Boolean);
      }
    } else if (type === 'group') {
      const uniqueChildren = Array.from(new Set(children || []));
      const sanitizedChildren = uniqueChildren.filter((cid) => cid && cid !== formId);

      // Prevent cycles (A -> ... -> A)
      if (wouldCreateCycle(items, formId, sanitizedChildren)) {
        alert('Invalid selection: this would create a circular group reference.');
        return;
      }

      // Optional: enforce single parent group
      if (ENFORCE_SINGLE_PARENT_GROUP) {
        for (const cid of sanitizedChildren) {
          const other = findOtherParentGroup(items, cid, formId);
          if (other) {
            alert(
              `"${items[cid]?.name || cid}" is already in group "${other.name}". Remove it first.`
            );
            return;
          }
        }
      }

      newItem.children = sanitizedChildren;
      newItem.targetCount = Number(targetCount);
      if (levelEnabled) newItem.levelStrategy = levelStrategy;
    }

    updateItem(newItem, { immediate: true });
    onClose?.();
    // reset
    if (!isEdit) {
      setFormId(uuidv4()); // 🟢 Reset for next new item
    }
    setName('');
    setUnit('');
    setDailyGoal('');
    setStartDate('');
    setEndDate('');
    setLevelEnabled(false);
    setLevelThreshold('');
    setMainLevels('');
    setChildren([]);
    setTargetCount(1);
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
      <h3>Add New {type === 'habit' ? 'Habit' : 'Group'}</h3>
      <label>
        Type:
        <select
          value={type}
          onChange={(e) => setType(e.target.value)}
          style={{ marginLeft: '10px' }}
        >
          <option value="habit">Habit</option>
          <option value="group">Group</option>
        </select>
      </label>
      <br />
      <label>
        Name:
        <input value={name} onChange={(e) => setName(e.target.value)} required />
      </label>
      <br />
      {type === 'habit' && (
        <>
          <label>
            Unit:
            <select
              value={unit}
              onChange={(e) => setUnit(e.target.value)}
              required
              style={{ marginLeft: '10px' }}
            >
              <option value="">(Select unit)</option>
              {Array.from(new Set(UNIT_OPTIONS)).map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </label>

          <br />
          <label>
            Daily Goal:{' '}
            <input
              type="number"
              value={dailyGoal}
              onChange={(e) => setDailyGoal(Number(e.target.value))}
            />
          </label>
          <br />
          <label>
            Start Date:{' '}
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <br />
          <label>
            End Date:{' '}
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>
          <br />
          <label>
            Group:
            <select
              value={parentGroup}
              onChange={(e) => setParentGroup(e.target.value)}
              style={{ marginLeft: '10px' }}
            >
              <option value="">(No group)</option>
              {Object.values(items)
                .filter((i) => i.type === 'group')
                .map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
                  </option>
                ))}
            </select>
          </label>
          <br />
        </>
      )}
      {type === 'group' && (
        <>
          <label>
            Select Children:
            <select
              multiple
              size={5} // shows 5 items
              style={{ width: '100%', marginTop: '5px' }}
              value={children}
              onChange={(e) => {
                const selected = Array.from(e.target.selectedOptions, (option) => option.value);
                setChildren(selected);
              }}
            >
              {selectableChildren.map(({ it, disabled, reason }) => (
                <option key={it.id} value={it.id} disabled={disabled}>
                  {it.name} ({it.type}){disabled ? ` — ⚠️ ${reason}` : ''}
                </option>
              ))}
            </select>
          </label>
          <br />

          <label>
            Target Count:{' '}
            <input
              type="number"
              value={targetCount}
              onChange={(e) => setTargetCount(e.target.value)}
            />
          </label>
          <br />
        </>
      )}
      <label>
        Level Enabled:
        <input
          type="checkbox"
          checked={levelEnabled}
          onChange={(e) => setLevelEnabled(e.target.checked)}
        />
      </label>
      <br />
      {levelEnabled && type === 'habit' && (
        <>
          <label>
            Level Threshold:
            <input
              type="number"
              value={levelThreshold}
              placeholder="e.g., 100"
              onChange={(e) => setLevelThreshold(e.target.value)}
            />
          </label>
          <br />
          <label>
            Level Multiplier:
            <input
              type="number"
              value={levelMultiplier}
              placeholder="e.g., 3 for x3 per level"
              onChange={(e) => setLevelMultiplier(e.target.value)}
            />
          </label>
          <br />
          <label>
            Main Levels (comma-separated):{' '}
            <input value={mainLevels} onChange={(e) => setMainLevels(e.target.value)} />
          </label>
          <br />
        </>
      )}
      {levelEnabled && type === 'group' && (
        <>
          <label>
            Level Strategy:
            <select value={levelStrategy} onChange={(e) => setLevelStrategy(e.target.value)}>
              <option value="max">Max</option>
              <option value="min">Min</option>
              <option value="avg">Average</option>
            </select>
          </label>
          <br />
        </>
      )}
      <button type="submit">{isEdit ? 'Save Changes' : 'Add'}</button>
    </form>
  );
}

export default AddItemForm;
