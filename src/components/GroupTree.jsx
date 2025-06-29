//Filename: src/components/GroupTree.jsx
import { evaluateCompletion } from './evaluate';

function GroupTree({items, itemId, selectedDate, updateItem, deleteItem, setEditItem}) {
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

  const mainLevelName = isLevelHabit
    ? item.mainLevels?.[mainLevelIndex] || 'Unnamed'
    : '';

  const renderHabitInput = () => {
    const value = isLevelHabit
      ? item.progressByMainLevel?.[mainLevelIndex]?.[selectedDate] ?? ''
      : item.progressByDate?.[selectedDate] ?? '';

    return (
        <input
          type="number"
          min="0"
          value={String(value)}
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
    const label = isLevelHabit
      ? `${mainLevelName} LV${level ?? 0} (totalCount: ${totalCount})`
      : `${item.name}: `;

    const progressPercent = nextLevelTotal > 0
      ? Math.min(100, Math.floor((totalCount / nextLevelTotal) * 100))
      : 0;

    const nextThreshold = isLevelHabit ? totalChildren : 0; 

    const status = completed ? '✅' : '❌';

    return (
      <div>
        {status} {label} — {renderHabitInput()}/{requiredTarget} {item.unit}

        {isLevelHabit && (
          <div style={{
            marginTop: '6px',
            marginBottom: '4px',
            fontSize: '12px',
            color: '#666'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span>LV{level}</span>
              <span>{totalCount} / {nextLevelTotal}</span>
              <span>LV{level + 1}</span>
            </div>
            <div style={{
              height: '10px',
              background: '#e0e0e0',
              borderRadius: '5px',
              overflow: 'hidden',
              marginTop: '4px'
            }}>
              <div style={{
                width: `${progressPercent}%`,
                height: '100%',
                background: '#4caf50',
                transition: 'width 0.3s'
              }} />
            </div>
          </div>
        )}

        {isLevelHabit && (
          <button
            style={{ marginLeft: '10px', fontSize: '12px' }}
            disabled={mainLevelIndex + 1 >= item.mainLevels.length}
            onClick={() => {
              updateItem({
                ...item,
                currentMainLevel: mainLevelIndex + 1
              });
            }}
          >
            Upgrade 
          </button>
        )}
        <button
          style={{ marginLeft: '10px', fontSize: '12px' }}
          onClick={() => setEditItem(item)}
        >
          ✏️ Edit
        </button>
        <button
          style={{ marginLeft: '10px', fontSize: '12px' }}
          onClick={() => {
            if (confirm(`Delete "${item.name}"?`)) {
              deleteItem(item.id);
            }
          }}
        >
          🗑️ Delete
        </button>
      </div>
    );
  };


  const renderGroupLine = () => {
    return (
      <div>
        {completed ? '✅' : '❌'} {item.name} ({count}/{totalChildren} required)
        <button
          style={{ marginLeft: '10px', fontSize: '12px' }}
          onClick={() => setEditItem(item)}
        >
          ✏️ Edit
        </button>
        <button
          style={{ marginLeft: '10px', fontSize: '12px' }}
          onClick={() => {
            if (confirm(`Are you sure you want to delete "${item.name}"?`)) {
              deleteItem(item.id);
            }
          }}
        >
          🗑️ Delete
        </button>
      </div>
    );
  };

  return (
    <div style={{
      marginLeft: '20px',
      borderLeft: '2px solid #ccc',
      paddingLeft: '10px',
      marginBottom: '10px'
    }}>
      {isGroup && renderGroupLine()}
      {isHabit && renderHabitLine()}

      {isGroup && item.children.map(childId => (
        <GroupTree
          key={childId}
          items={items}
          itemId={childId}
          selectedDate={selectedDate}
          updateItem={updateItem}
          deleteItem={deleteItem}
          setEditItem={setEditItem}
        />
      ))}
    </div>
  );
}

export default GroupTree;
