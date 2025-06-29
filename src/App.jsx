// Filename: src/App.jsx

import { useState, useEffect } from "react";
import GroupTree from "./components/GroupTree";
import initialItems from "./data/initialItems";
import AddItemForm from "./components/AddItemForm";

function App() {
  //localStorage.removeItem('habit_items'); // ← Add this line just before useState
  const [view, setView] = useState("main"); // 'main' | 'calendar' | 'settings'

  const [showForm, setShowForm] = useState(false);
  const [editItem, setEditItem] = useState(null); // null or item object

  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [items, setItems] = useState(() => {
    const saved = localStorage.getItem("habit_items");
    return saved ? JSON.parse(saved) : initialItems;
  });

  useEffect(() => {
    localStorage.setItem("habit_items", JSON.stringify(items));
  }, [items]);

  const updateItem = (updated) => {
    setItems((prev) => ({
      ...prev,
      [updated.id]: updated,
    }));
  };

  // Helper to format Date to YYYY-MM-DD
  const formatDate = (date) => date.toISOString().split("T")[0];

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

  const deleteItem = (idToDelete) => {
    setItems((prev) => {
      const updated = { ...prev };
      const target = updated[idToDelete];
      if (!target) return prev;

      // ✅ If it's a group: delete it, but keep children intact
      if (target.type === "group") {
        delete updated[idToDelete];
        // Do not delete children — they will be promoted to top level automatically
      } else {
        // ✅ If it's a habit: delete it freely
        delete updated[idToDelete];
      }

      // ✅ Remove deleted ID from any group's children list
      for (const key in updated) {
        if (updated[key].type === "group") {
          updated[key].children = updated[key].children?.filter(
            (childId) => childId !== idToDelete
          );
        }
      }

      return updated;
    });
  };

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100vh",
      }}
    >
      {/* Top */}
      <div
        style={{
          flex: "0 0 auto",
          padding: "10px",
          background: "rgb(239, 248, 227)",
          borderBottom: "1px solid #ccc",
          position: "sticky",
          top: 0,
          zIndex: 100,
          textAlign: "center",
        }}
      >
        <h1 style={{ margin: 0 }}>Habit Tracker</h1>
      </div>

      {/* Middle */}
      <div
        style={{
          flex: "1 1 auto",
          overflowY: "auto",
          padding: "16px",
          paddingBottom: "80px",
        }}
      >
        {view === "main" && (
          <>
            {/* Date Picker */}
            <div
              style={{
                display: "flex",
                alignItems: "center",
                gap: "10px",
                marginBottom: "16px",
                justifyContent: "center",
              }}
            >
              <button onClick={goToPreviousDay}>◀</button>
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
              />
              <button onClick={goToNextDay}>▶</button>
            </div>

            <div style={{ maxWidth: "800px", margin: "0 auto" }}>
              {Object.values(items)
                .filter((item) => {
                  const allChildren = Object.values(items)
                    .filter((i) => i.type === "group")
                    .flatMap((g) => g.children);
                  return !allChildren.includes(item.id);
                })
                .map((item) => (
                  <GroupTree
                    key={item.id}
                    items={items}
                    itemId={item.id}
                    selectedDate={selectedDate}
                    updateItem={updateItem}
                    deleteItem={deleteItem}
                    setEditItem={setEditItem}
                  />
                ))}
            </div>
          </>
        )}

        {view === "calendar" && (
          <div style={{ textAlign: "center" }}>
            <h2>📅 Calendar View</h2>
            <p>Coming soon or place your calendar UI here</p>
          </div>
        )}

        {view === "settings" && (
          <div style={{ textAlign: "center" }}>
            <h2>⚙️ Settings View</h2>
            <p>User preferences, dark mode, export data etc.</p>
          </div>
        )}
      </div>

      {showForm && (
        <div
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            right: "0",
            bottom: "0",
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "rgb(75, 111, 80)",
              padding: "20px",
              borderRadius: "8px",
              maxWidth: "500px",
              width: "90%",
            }}
          >
            <button
              onClick={() => setShowForm(false)}
              style={{
                float: "right",
                fontSize: "16px",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              ✖
            </button>
            <AddItemForm items={items} setItems={setItems} />
          </div>
        </div>
      )}

      <button
        onClick={() => setShowForm(true)}
        style={{
          position: "fixed",
          bottom: "30px",
          right: "30px",
          width: "50px",
          height: "50px",
          borderRadius: "50%",
          fontSize: "24px",
          backgroundColor: "#007bff",
          color: "#fff",
          border: "none",
          cursor: "pointer",
          boxShadow: "0 2px 6px rgba(0,0,0,0.2)",
        }}
      >
        +
      </button>
      {editItem && (
        <div
          style={{
            position: "fixed",
            top: "0",
            left: "0",
            right: "0",
            bottom: "0",
            backgroundColor: "rgba(0, 0, 0, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              backgroundColor: "rgba(6, 52, 19, 0.4)",
              padding: "20px",
              borderRadius: "8px",
              maxWidth: "500px",
              width: "90%",
            }}
          >
            <button
              onClick={() => setEditItem(null)}
              style={{
                float: "right",
                fontSize: "16px",
                background: "none",
                border: "none",
                cursor: "pointer",
              }}
            >
              ✖
            </button>
            <AddItemForm
              items={items}
              setItems={setItems}
              editItem={editItem}
              onClose={() => setEditItem(null)}
            />
          </div>
        </div>
      )}
      {/* Bottom */}
      <div
        style={{
          flex: "0 0 auto",
          position: "fixed",
          bottom: 0,
          left: 0,
          width: "100%",
          background: "rgb(239, 248, 227)",
          borderTop: "1px solid #ccc",
          padding: "10px 20px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 100,
        }}
      >
        <button
          onClick={() => {
            if (view !== "main") {
              setView("main");
              setShowForm(false); // hide form if switching back
            } else {
              setShowForm(true); // toggle form on current main view
            }
          }}
        >
          ➕
        </button>

        <button
          onClick={() => {
            setView("calendar");
            setShowForm(false);
          }}
        >
          📅
        </button>

        <button
          onClick={() => {
            setView("settings");
            setShowForm(false);
          }}
        >
          ⚙️
        </button>
      </div>
    </div>
  );
}

export default App;
