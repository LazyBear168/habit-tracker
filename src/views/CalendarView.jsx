// File: src/views/CalendarView.jsx
// Author: Cheng
// Description:
//   Displays a weekly calendar view of top-level and child habits.
//   For each habit, it shows completion status per day using icons,
//   based on evaluated habit data. Users can navigate between weeks.
//   Designed to visualize daily progress and encourage consistency.

import { useState, useMemo } from 'react';
import { evaluateCompletion } from '../components/evaluate';
import { GoCheckCircle } from 'react-icons/go';
import { RxCross2 } from 'react-icons/rx';

export default function CalendarView({ items }) {
  const [weekOffset, setWeekOffset] = useState(0); // 0 = current week, -1 = prev week, +1 = next week

  // Calculate week dates based on offset
  const weekDates = useMemo(() => {
    const today = new Date();
    const sunday = new Date(today);
    sunday.setDate(today.getDate() - today.getDay() + weekOffset * 7);

    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(sunday);
      d.setDate(sunday.getDate() + i);
      return d.toISOString().split('T')[0];
    });
  }, [weekOffset]);

  // Get top-level items (not children)
  const topLevelItems = Object.values(items).filter((item) => {
    const allChildren = Object.values(items)
      .filter((i) => i.type === 'group')
      .flatMap((g) => g.children || []);
    return !allChildren.includes(item.id);
  });

  return (
    <div className="app-main" style={{ overflowX: 'auto' }}>
      <div style={{ display: 'flex', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
        <button
          style={{ display: 'block', background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={() => setWeekOffset((prev) => prev - 1)}
        >
          ◀
        </button>
        <h2>Weekly Progress</h2>
        <button
          style={{ display: 'block', background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={() => setWeekOffset((prev) => prev + 1)}
        >
          ▶
        </button>
      </div>

      <table style={{ borderCollapse: 'collapse', width: '100%' }}>
        <thead>
          <tr>
            <th style={{ textAlign: 'left', padding: '8px' }}>Item</th>
            {weekDates.map((date) => {
              const d = new Date(date);
              const label = `${d.getDate()} ${d.toLocaleDateString('en-US', { weekday: 'short' })}`;
              return (
                <th key={date} style={{ padding: '8px', textAlign: 'center' }}>
                  {label}
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody>
          {topLevelItems.map((item) => (
            <>
              <tr key={item.id} style={{ backgroundColor: '#e0f7fa', fontWeight: 'bold' }}>
                <td style={{ padding: '8px' }}>{item.name}</td>
                {weekDates.map((date) => {
                  const { completed } = evaluateCompletion(items, item.id, date);
                  return (
                    <td key={date} style={{ textAlign: 'center' }}>
                      {completed ? (
                        <GoCheckCircle color="orange" size={20} />
                      ) : (
                        <RxCross2 color="red" size={20} />
                      )}
                    </td>
                  );
                })}
              </tr>

              {item.children?.map((childId) => {
                const child = items[childId];
                return (
                  <tr key={childId}>
                    <td style={{ padding: '8px', paddingLeft: '24px' }}>↳ {child.name}</td>
                    {weekDates.map((date) => {
                      const { completed } = evaluateCompletion(items, childId, date);
                      return (
                        <td key={date} style={{ textAlign: 'center' }}>
                          {completed ? (
                            <GoCheckCircle color="orange" size={20} />
                          ) : (
                            <RxCross2 color="red" size={20} />
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </>
          ))}
        </tbody>
      </table>
    </div>
  );
}
