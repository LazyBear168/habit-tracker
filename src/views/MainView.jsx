// File: src/views/MainView.jsx
// Author: Cheng
// Description:
//   Main daily view for habit tracking. Displays a list of top-level habit groups,
//   each rendered via the GroupTree component. Users can navigate between days
//   using date controls, view or manage habit items, and perform CRUD operations.
//   Designed to be the default user interface for daily habit interaction.

import GroupTree from '../components/GroupTree';

export default function MainView({
  items,
  selectedDate,
  setSelectedDate,
  updateItem,
  deleteItem,
  setEditItem,
  goToPreviousDay,
  goToNextDay,
  openDropdownId,
  setOpenDropdownId
}) {
  const topLevelItems = Object.values(items).filter((item) => {
    const allChildren = Object.values(items)
      .filter((i) => i.type === 'group')
      .flatMap((g) => g.children);
    return !allChildren.includes(item.id);
  });

  return (
    <>
      <div
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 90,
          background: '#f8f9f5', // match your app background
          padding: '8px',
          display: 'flex',
          justifyContent: 'center',
          gap: '0px'
        }}
      >
        <button
          style={{ display: 'block', background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={goToPreviousDay}
        >
          ◀
        </button>
        <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} />
        <button
          style={{ display: 'block', background: 'none', border: 'none', cursor: 'pointer' }}
          onClick={goToNextDay}
        >
          ▶
        </button>
      </div>

      <div style={{ maxWidth: '500px', margin: '0 auto' }}>
        {topLevelItems.map((item) => (
          <GroupTree
            key={item.id}
            items={items}
            itemId={item.id}
            selectedDate={selectedDate}
            updateItem={updateItem}
            deleteItem={deleteItem}
            setEditItem={setEditItem}
            openDropdownId={openDropdownId}
            setOpenDropdownId={setOpenDropdownId}
          />
        ))}
      </div>
    </>
  );
}
