// Filename: src/components/HabitItem.jsx

function HabitItem({ habit, updateHabit, onDelete, selectedDate }) {
  const {
    name, type, unit, dailyGoal,
    startDate, endDate,
    progressByDate = {}
  } = habit;

  const inRange =
    new Date(selectedDate) >= new Date(startDate) &&
    (!endDate || new Date(selectedDate) <= new Date(endDate));

  const value = progressByDate[selectedDate] ?? '';
  const completed = value >= dailyGoal;

  const handleInput = (value) => {
    const num = parseFloat(value);
    const updated = {
      ...habit,
      progressByDate: {
        ...progressByDate,
        [selectedDate]: isNaN(num) ? 0 : num
      }
    };
    updateHabit(updated);
  };

  if (!inRange) return null;

  return (
    <div style={{
      border: '1px solid #ccc',
      padding: '12px',
      marginBottom: '20px',
      borderRadius: '8px'
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <h3>{name} ({dailyGoal} {unit}/day)</h3>
        <button onClick={onDelete} style={{ color: 'red', border: 'none', background: 'none', cursor: 'pointer' }}>
          🗑 Delete
        </button>
      </div>

      <div style={{
        marginTop: '10px',
        padding: '8px',
        backgroundColor: completed ? 'rgb(3, 141, 42)' : 'rgb(116, 109, 109)',
        borderRadius: '6px',
        fontSize: '14px'
      }}>
        <strong>{selectedDate}</strong>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginTop: '5px' }}>
          <input
            type="number"
            min="0"
            value={value}
            onChange={(e) => handleInput(e.target.value)}
            style={{ width: '80px', fontSize: '14px' }}
          />
          <span>{unit}</span>
          {completed && <span style={{ color: 'green', fontWeight: 'bold' }}>✓ Completed</span>}
        </div>
      </div>
    </div>
  );
}

export default HabitItem;
