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

function AddItemForm({ items, updateItem, editItem = null, onClose }) {
  const isEdit = !!editItem;

  const [type, setType] = useState(editItem?.type || 'habit');
  const [formId, setFormId] = useState(editItem?.id || uuidv4());

  const [name, setName] = useState(editItem?.name || '');
  const [unit, setUnit] = useState(editItem?.unit || '');
  const [dailyGoal, setDailyGoal] = useState(editItem?.dailyGoal || '');
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
      newItem.children = children;
      newItem.targetCount = Number(targetCount);
      if (levelEnabled) {
        newItem.levelStrategy = levelStrategy;
      }
    }

    await updateItem(newItem);
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
            Unit: <input value={unit} required onChange={(e) => setUnit(e.target.value)} />
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
              {Object.values(items)
                .filter((i) => i.id !== name) // Prevent self-referencing
                .map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name} ({item.type})
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
