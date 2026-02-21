// File: src/App.jsx
// Author: Cheng
// Description:
//    Main App component handling routing, Firebase auth, real-time Firestore sync,
//    habit CRUD logic, and rendering views (Main, Calendar, Settings).
//    Firebase writes: habits 使用 debounce（約 900ms）減少寫入次數；新增/編輯表單用 immediate 立即寫入。

import { useState, useEffect, useRef } from 'react';
import { auth } from './firebase';
import { onAuthStateChanged, signOut } from 'firebase/auth';

import Login from './components/Login';

import './App.css';
import MainView from './views/MainView';
import CalendarView from './views/CalendarView';
import SettingsView from './views/SettingsView';
import BottomBar from './components/BottomBar';
import AddItemForm from './components/AddItemForm';
import { db } from './firebase';
import { collection, setDoc, doc, onSnapshot } from 'firebase/firestore';
import { deleteDoc } from 'firebase/firestore';

// Debounce Firestore writes per document to reduce write count (e.g. rapid +10/+20 clicks)
const HABIT_WRITE_DEBOUNCE_MS = 900;

function App() {
  const [user, setUser] = useState(null);
  const userId = user?.uid;

  const [view, setView] = useState('main');
  const [showForm, setShowForm] = useState(false); // Show add list or not
  const [editItem, setEditItem] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null); // null = no dropdown open
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState({});

  const pendingWritesRef = useRef({});
  const writeTimersRef = useRef({});

  // Sets up an authentication state listener on mount; updates the user state when
  // the auth status changes. Cleans up the listener when the component unmounts.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;

    const unsubscribe = onSnapshot(
      collection(db, `users/${userId}/habits`),
      (snapshot) => {
        const data = {};
        snapshot.forEach((d) => {
          data[d.id] = { id: d.id, ...d.data() }; // ✅ 補 id
        });
        setItems(data);
      },
      (err) => {
        console.error('🔥 habits onSnapshot error:', err.code, err.message);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // Clear debounce timers on unmount (do not flush to avoid write after logout)
  useEffect(() => {
    return () => {
      Object.values(writeTimersRef.current).forEach(clearTimeout);
      writeTimersRef.current = {};
      pendingWritesRef.current = {};
    };
  }, []);

  useEffect(() => {
    localStorage.setItem('habit_items', JSON.stringify(items));
  }, [items]);

  if (!user) return <Login onLogin={setUser} />;

  const handleLogout = () => signOut(auth);

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

  const flushOne = (id, uid) => {
    const toWrite = pendingWritesRef.current[id];
    delete pendingWritesRef.current[id];
    delete writeTimersRef.current[id];
    if (!toWrite || !uid) return;
    setDoc(doc(db, `users/${uid}/habits`, toWrite.id), toWrite, { merge: true }).catch((e) => {
      console.error('🔥 setDoc failed:', e.code, e.message, toWrite);
    });
  };

  const updateItem = (updated, options = {}) => {
    if (!userId) {
      console.error('🔥 updateItem without userId', updated);
      return;
    }

    if (!updated?.id) {
      console.error('🔥 updateItem missing id', updated);
      return;
    }

    const id = updated.id;
    const immediate = options.immediate === true;

    // UI 先更新（即時反應）
    setItems((prev) => ({
      ...prev,
      [id]: updated
    }));

    if (immediate) {
      // 新增/編輯表單儲存時立即寫入，不 debounce
      if (writeTimersRef.current[id]) {
        clearTimeout(writeTimersRef.current[id]);
        delete writeTimersRef.current[id];
      }
      pendingWritesRef.current[id] = updated;
      flushOne(id, userId);
      return;
    }

    // Debounce Firestore write: 同一 document 短時間內只寫入最後一次
    pendingWritesRef.current[id] = updated;
    if (writeTimersRef.current[id]) clearTimeout(writeTimersRef.current[id]);
    writeTimersRef.current[id] = setTimeout(() => {
      flushOne(id, userId);
    }, HABIT_WRITE_DEBOUNCE_MS);
  };
  const deleteItem = async (idToDelete) => {
    await deleteDoc(doc(db, `users/${userId}/habits`, idToDelete));
    setItems((prev) => {
      const updated = { ...prev };
      delete updated[idToDelete];
      for (const key in updated) {
        const item = updated[key];

        if (item.type === 'group' && item.children) {
          updated[key] = {
            ...item, // ← 建立新 object（重要）
            children: item.children.filter((childId) => childId !== idToDelete)
          };
        }
      }
      return updated;
    });
  };

  return (
    <div className="app-container">
      <div className="app-header">
        <h1>
          Habit Tracker <span style={{ fontSize: '0.5em' }}>Happy new year 📆</span>
        </h1>
      </div>

      <div className="app-main">
        {view === 'main' && (
          <MainView
            userId={userId}
            items={items}
            selectedDate={selectedDate}
            setSelectedDate={setSelectedDate}
            updateItem={updateItem}
            deleteItem={deleteItem}
            setEditItem={setEditItem}
            goToPreviousDay={goToPreviousDay}
            goToNextDay={goToNextDay}
            openDropdownId={openDropdownId}
            setOpenDropdownId={setOpenDropdownId}
          />
        )}
        {view === 'calendar' && <CalendarView items={items} selectedDate={selectedDate} />}

        {view === 'settings' && (
          <SettingsView
            items={items}
            setItems={setItems}
            updateItem={updateItem}
            onLogout={() => signOut(auth)}
          />
        )}
      </div>

      {showForm && !editItem && (
        <div className="modal-overlay">
          <div className="modal-box">
            <button className="close-button" onClick={() => setShowForm(false)}>
              ✖
            </button>
            <AddItemForm items={items} updateItem={updateItem} onClose={() => setShowForm(false)} />
          </div>
        </div>
      )}

      {editItem && !showForm && (
        <div className="modal-overlay">
          <div className="modal-box">
            <button className="close-button" onClick={() => setEditItem(null)}>
              ✖
            </button>
            <AddItemForm
              items={items}
              updateItem={updateItem}
              editItem={editItem}
              onClose={() => setEditItem(null)}
            />
          </div>
        </div>
      )}

      <BottomBar view={view} setView={setView} setShowForm={setShowForm} />
    </div>
  );
}

export default App;
