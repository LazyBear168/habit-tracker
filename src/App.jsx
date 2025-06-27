// File name: src/App.jsx

import { useState, useEffect } from 'react';
import AddHabitForm from './components/AddHabitForm';
import HabitList from './components/HabitList';

function App() {
  const [habits, setHabits] = useState(() => {
    return JSON.parse(localStorage.getItem('habits')) || [];
  });

  const [selectedDate, setSelectedDate] = useState(() => {
    return new Date().toISOString().split('T')[0]; // today
  });

  useEffect(() => {
    localStorage.setItem('habits', JSON.stringify(habits));
  }, [habits]);

   // Helper to format Date to YYYY-MM-DD
  const formatDate = (date) => date.toISOString().split('T')[0];

  const goToPreviousDay = () => {
    const prev = new Date(selectedDate);
    prev.setDate(prev.getDate() - 1);
    setSelectedDate(formatDate(prev));
  };

  const goToNextDay = () => {
    const next = new Date(selectedDate);
    next.setDate(next.getDate() + 1);
    setSelectedDate(formatDate(next));
  };

  return (
    <div style={{ maxWidth: '700px', margin: '40px auto' }}>
      <h1>📊 Habit Tracker</h1>
      {/* Date Selector with Prev/Next */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
        <button onClick={goToPreviousDay}>◀</button>
        <input
          type="date"
          value={selectedDate}
          onChange={(e) => setSelectedDate(e.target.value)}
        />
        <button onClick={goToNextDay}>▶</button>
      </div>
      <AddHabitForm setHabits={setHabits} />
      <HabitList
        habits={habits}
        setHabits={setHabits}
        selectedDate={selectedDate}
      />
    </div>
  );
}

export default App;
