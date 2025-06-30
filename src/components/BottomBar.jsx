// src/components/BottomBar.jsx
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
