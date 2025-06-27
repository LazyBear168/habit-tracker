// Filename: src/components/AddHabitForm.jsx

import { useState } from 'react';

function AddHabitForm({ setHabits }) {
  const [name, setName] = useState('');
  const [type, setType] = useState('count');
  const [unit, setUnit] = useState('');
  const [dailyGoal, setDailyGoal] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name || !startDate || !dailyGoal || !unit) return;

    const newHabit = {
      id: Date.now(),
      name,
      type,
      unit,
      dailyGoal: Number(dailyGoal),
      startDate,
      endDate: endDate || null,
      progressByDate: {}  // { "2024-06-27": 3 }
    };

    setHabits(prev => [...prev, newHabit]);

    // Reset form
    setName('');
    setType('count');
    setUnit('');
    setDailyGoal('');
    setStartDate('');
    setEndDate('');
  };

  return (
    <form onSubmit={handleSubmit} style={{ marginBottom: '20px' }}>
      <input
        type="text"
        placeholder="Habit name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        required
        style={{ padding: '6px', marginRight: '8px' }}
      />
      <select value={type} onChange={(e) => setType(e.target.value)} style={{ marginRight: '8px' }}>
        <option value="count">Count</option>
        <option value="duration">Duration</option>
      </select>
      <input
        type="text"
        placeholder="Unit (cups, hrs)"
        value={unit}
        onChange={(e) => setUnit(e.target.value)}
        required
        style={{ padding: '6px', marginRight: '8px', width: '100px' }}
      />
      <input
        type="number"
        placeholder="Daily Goal"
        value={dailyGoal}
        onChange={(e) => setDailyGoal(e.target.value)}
        required
        style={{ padding: '6px', marginRight: '8px', width: '100px' }}
      />
      <input
        type="date"
        value={startDate}
        onChange={(e) => setStartDate(e.target.value)}
        required
        style={{ marginRight: '8px' }}
      />
      <input
        type="date"
        value={endDate}
        onChange={(e) => setEndDate(e.target.value)}
        style={{ marginRight: '8px' }}
      />
      <button type="submit">Add Habit</button>
    </form>
  );
}

export default AddHabitForm;
