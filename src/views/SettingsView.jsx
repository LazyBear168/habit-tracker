// src/views/SettingsView.jsx
import { useRef } from 'react';

export default function SettingsView({ items, setItems, updateItem, onLogout }) {
  const fileInputRef = useRef();

  // Export data as JSON file
  const handleExport = () => {
    const blob = new Blob([JSON.stringify(items, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'habit_data.json';
    a.click();
    URL.revokeObjectURL(url);
  };

  // Import data from JSON file
  const handleImport = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const parsed = JSON.parse(event.target.result);
        if (typeof parsed === 'object' && parsed !== null) {
          // Loop through each item and call updateItem
          for (const itemId in parsed) {
            await updateItem(parsed[itemId]); // 🔁 this will push to Firestore
          }
          alert('Import successful!');
        } else {
          alert('Invalid file content');
        }
      } catch {
        alert('Failed to parse file');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div style={{ textAlign: 'center', padding: '20px' }}>
      <h2>⚙️ Settings View</h2>

      <button onClick={handleExport}>📤 Export Data</button>
      <br />
      <br />

      <button onClick={() => fileInputRef.current.click()}>📥 Import Data</button>
      <input
        type="file"
        accept="application/json"
        ref={fileInputRef}
        style={{ display: 'none' }}
        onChange={handleImport}
      />
      <br />
      <br />
      <button onClick={onLogout}>🔓 Sign Out</button>

      <p style={{ fontSize: '0.9rem', color: '#666' }}>
        Export will download all habit and group data.
        <br />
        Import will replace current data with the selected JSON file.
      </p>
    </div>
  );
}
