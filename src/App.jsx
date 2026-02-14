// File: src/App.jsx
// Author: Cheng
// Description:
//    Main App component handling routing, Firebase auth, real-time Firestore sync,
//    habit CRUD logic, and rendering views (Main, Calendar, Settings)

import { useState, useEffect } from 'react';
import { auth } from './firebase';
import { signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from 'firebase/auth';

import Login from './components/Login';

import './App.css';
import MainView from './views/MainView';
import CalendarView from './views/CalendarView';
import SettingsView from './views/SettingsView';
import BottomBar from './components/BottomBar';
import AddItemForm from './components/AddItemForm';
import { db } from './firebase';
import { collection, getDocs, setDoc, doc, onSnapshot } from 'firebase/firestore';
import { deleteDoc } from 'firebase/firestore';

function App() {
  const [user, setUser] = useState(null);
  const userId = user?.uid;

  const [view, setView] = useState('main');
  const [showForm, setShowForm] = useState(false); // Show add list or not
  const [editItem, setEditItem] = useState(null);
  const [openDropdownId, setOpenDropdownId] = useState(null); // null = no dropdown open
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [items, setItems] = useState({});

  // Sets up an authentication state listener on mount; updates the user state when 
  // the auth status changes. Cleans up the listener when the component unmounts.
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, setUser);
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!userId) return;
    const unsubscribe = onSnapshot(collection(db, `users/${userId}/habits`), (snapshot) => {
      const data = {};
      snapshot.forEach((doc) => {
        data[doc.id] = doc.data();
      });
      setItems(data);
    });
    return () => unsubscribe();
  }, [userId]);

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

  const updateItem = async (updated) => {
    setItems((prev) => ({
      ...prev,
      [updated.id]: updated
    }));

    await setDoc(doc(db, `users/${userId}/habits`, updated.id), updated);
  };

  const deleteItem = async (idToDelete) => {
    await deleteDoc(doc(db, `users/${userId}/habits`, idToDelete));
    setItems((prev) => {
      const updated = { ...prev };
      delete updated[idToDelete];
      for (const key in updated) {
        if (updated[key].type === 'group') {
          updated[key].children = updated[key].children?.filter(
            (childId) => childId !== idToDelete
          );
        }
      }
      return updated;
    });
  };

  return (
    <div className="app-container">
      <div className="app-header">
        <h1>Habit Tracker</h1>
      </div>

      <div className="app-main">
        {view === 'main' && (
          <MainView
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
