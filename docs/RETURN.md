# Habit Tracker — Return Guide

## 1. System Overview

Main UI Structure:

GroupTree (recursive)
  └── HabitRow (single habit UI)
        ├── useHabitValue (read/write today's value)
        ├── useBoundHabitTimer (timer + commit to bound target)
        ├── HabitValueCalculator (manual input)
        └── Dropdown / ProgressBar

Reading Order (Fast Memory Restore):

1. data logic → useHabitValue
2. timer logic → useBoundHabitTimer
3. UI row → HabitRow
4. recursion → GroupTree

Core Rule:

- Minutes unit stored as **seconds**
- UI always works in **display value**
- Conversion handled inside hook, NOT UI

---

## 2. State Flow (IMPORTANT)

Value update flow:

User Action
→ useHabitValue / Calculator / Timer
→ updateItem(newItem)
→ items state updated
→ evaluateCompletion recalculates progress
→ UI re-render

Timer commit flow:

Start → bind target (itemId + date + levelIndex)
Stop → commit seconds to bound target
UI selection change DOES NOT change commit target

---

## 3. Timer Behavior Rules

Timer states:

Idle → Countdown → Timing → Commit

Rules:

- Countdown cancel = no commit
- Stop during timing = commit seconds
- Timer binds original habit & date
- Switching UI does NOT change commit target
- Timer only works for **minutes unit**

Timer core file:

useBoundHabitTimer.js

---

## 4. Most Important Files

GroupTree.jsx
→ recursion tree only

HabitRow.jsx
→ habit UI + timer + calculator

useHabitValue.js
→ single source of truth for value read/write

useBoundHabitTimer.js
→ timer logic + bind target

useHabitValueAtTarget.js
→ read/write by (itemId, date, levelIndex)

---

## 5. Data Model Reminder

Normal Habit:

progressByDate[date] = number

Level Habit:

progressByMainLevel[levelIndex][date] = number

Minutes Habit:

stored in **seconds**

---

## 6. Entry Map (Where to Look First)

If value wrong → useHabitValue
If timer wrong → useBoundHabitTimer
If UI wrong → HabitRow
If recursion wrong → GroupTree
If progress wrong → evaluateCompletion

---

## 7. If You Forgot Everything

Read in this order:

1. useHabitValue.js
2. useBoundHabitTimer.js
3. HabitRow.jsx
4. GroupTree.jsx

(Should restore memory in ~3 minutes)

---

## 8. Current Architecture Goal

- Easy to maintain
- Easy to extend
- Avoid over-engineering
- Single source of truth
- Logic separated from UI

---

# TODO

## Refactor

- [ ] Extract HabitRow component
- [ ] Extract Dropdown component
- [ ] Extract ProgressBar component

## Future Features

- [ ] Continue timer when switching item/date
- [ ] Multi-unit habit (kg + reps)
- [ ] Statistics / charts
- [ ] Data analytics / streak system
