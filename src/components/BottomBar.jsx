// File: src/components/BottomBar.jsx
// Author: Cheng
// Description:
//   Fixed navigation bar at the bottom of the app.
//   Provides three primary actions:
//   - Switch to Main View or open Add Item form (➕)
//   - Navigate to Calendar View (📅)
//   - Open Settings View (⚙️)
//   Dynamically determines whether to show the add form or switch views
//   based on current state.

export default function BottomBar({ view, setView, setShowForm }) {
  return (
    <div
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        width: '100%',
        background: 'rgb(239, 248, 227)',
        borderTop: '1px solid #ccc',
        padding: '10px',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        zIndex: 100
      }}
    >
      <button
        style={{
          width: '200px',
          display: 'block',
          background: 'none',
          border: 'none',
          cursor: 'pointer'
        }}
        onClick={() => {
          view !== 'main' ? setView('main') : setShowForm(true);
        }}
      >
        ➕
      </button>
      <button
        style={{
          width: '200px',
          display: 'block',
          background: 'none',
          border: 'none',
          cursor: 'pointer'
        }}
        onClick={() => setView('calendar')}
      >
        📅
      </button>
      <button
        style={{
          width: '200px',
          display: 'block',
          background: 'none',
          border: 'none',
          cursor: 'pointer'
        }}
        onClick={() => setView('settings')}
      >
        ⚙️
      </button>
    </div>
  );
}
