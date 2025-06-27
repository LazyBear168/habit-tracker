// Filename: src/components/HabitList.jsx

import HabitItem from './HabitItem';

function HabitList({ habits, setHabits, selectedDate  }) {
  const updateHabit = (updatedHabit) => {
    setHabits(habits.map(h => h.id === updatedHabit.id ? updatedHabit : h));
  };

  const deleteHabit = (id) => {
    if (window.confirm("Delete this habit?")) {
      setHabits(habits.filter(h => h.id !== id));
    }
  };

  return (
    <div>
      {habits.map(habit => (
        <HabitItem
          key={habit.id}
          habit={habit}
          updateHabit={updateHabit}
          onDelete={() => deleteHabit(habit.id)}
          selectedDate={selectedDate}
        />
      ))}
    </div>
  );
}

export default HabitList;
