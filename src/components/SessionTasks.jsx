// src/components/SessionTasks.jsx
import React, { useEffect, useState, useRef, useMemo } from "react";
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  doc,
  deleteDoc,
  getDocs,
  limit,
} from "firebase/firestore";

import TaskList from "./TaskList";
import TaskForm from "./TaskForm";
import GratitudeModal from "./GratitudeModal";
import { useAuth } from "./AuthProvider";

export default function SessionTasks({ sessionDate, onTasksChange }) {
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showGratitudeModal, setShowGratitudeModal] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState(null);

  const [plannerText, setPlannerText] = useState("");
  const [showPlanner, setShowPlanner] = useState(false);

  // Future-jump toast
  const [futureJumpMessage, setFutureJumpMessage] = useState(null);

  // Cache per-date
  const allTasksCache = useRef(null); // { date: 'YYYY-MM-DD', tasks: [...] }
  const lastFetch = useRef(0);
  const unsubRef = useRef(null);

  // dateRange for queries (string format consistent with your tasks.due)
  const dateRange = useMemo(
    () => ({
      startOfDay: sessionDate + "T00:00",
      endOfDay: sessionDate + "T23:59",
    }),
    [sessionDate]
  );

  const getDateMidnightFromIso = (iso) => {
    // iso may be "YYYY-MM-DD" or a full ISO
    const d = new Date(iso);
    d.setHours(0, 0, 0, 0);
    return d;
  };

  // -------------------- LOAD TASKS --------------------
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const now = Date.now();
    // Use cache only if it is for THIS selected date and recent
    if (
      allTasksCache.current &&
      allTasksCache.current.date === sessionDate &&
      now - lastFetch.current < 30000
    ) {
      setTasks(allTasksCache.current.tasks);
      setLoading(false);
      if (onTasksChange) onTasksChange(allTasksCache.current.tasks);
      return;
    }

    setLoading(true);

    // Remove previous listener
    if (unsubRef.current) {
      try {
        unsubRef.current();
      } catch (e) {}
      unsubRef.current = null;
    }

    const q = query(
      collection(db, "tasks"),
      where("uid", "==", user.uid),
      where("due", ">=", dateRange.startOfDay),
      where("due", "<=", dateRange.endOfDay),
      orderBy("due", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const arr = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
        setTasks(arr);
        lastFetch.current = Date.now();
        allTasksCache.current = { date: sessionDate, tasks: arr };
        if (onTasksChange) onTasksChange(arr);
        setLoading(false);
      },
      (err) => {
        console.error("Firestore realtime query failed:", err);
        // Do NOT fallback to full user query — that caused duplicates & slowness.
        setTasks([]);
        setLoading(false);
      }
    );

    unsubRef.current = unsub;
    return () => {
      try {
        unsub();
      } catch (e) {}
      unsubRef.current = null;
    };
  }, [sessionDate, user, onTasksChange, dateRange]);

  // -------------------- CRUD --------------------
  async function handleAddOrEdit(task) {
    if (!user) return;

    // Normalize text
    const text = (task.text || "").trim();
    if (!text) return;

    // Validate due
    const due = task.due;
    if (!due) return alert("Please select a due date/time.");

    // Prevent adding past date/time
    const now = new Date();
    const selected = new Date(due);
    if (selected < now) {
      return alert("You cannot add a task in the past. Please choose a future date/time.");
    }

    // Extract date-only
    const taskDate = due.slice(0, 10);
    if (!taskDate) return alert("Invalid due date.");

    // Duplicate check (Option A: same text + same day blocked)
    // Client-side (fast) if cache has the day
    if (allTasksCache.current && allTasksCache.current.date === taskDate) {
      const dup = allTasksCache.current.tasks.find(
        (t) => t.text?.trim() === text && t.due?.slice(0, 10) === taskDate
      );
      if (dup && (!task.id || dup.id !== task.id)) {
        return alert("Duplicate task for the same day blocked.");
      }
    } else {
      // Server-side safe check
      try {
        const q = query(
          collection(db, "tasks"),
          where("uid", "==", user.uid),
          where("text", "==", text),
          limit(5)
        );
        const snap = await getDocs(q);
        const found = snap.docs
          .map((d) => ({ ...d.data(), id: d.id }))
          .find((t) => t.due?.slice(0, 10) === taskDate && (!task.id || t.id !== task.id));
        if (found) {
          return alert("Duplicate task for the same day blocked.");
        }
      } catch (err) {
        console.error("Duplicate check failed:", err);
        // allow creation only if you want; we'll proceed but it's logged
      }
    }

    if (task.id) {
      // editing existing
      try {
        await updateDoc(doc(db, "tasks", task.id), {
          ...task,
          text,
          due,
          dueDate: due.slice(0, 10),
        });
        setEditing(null);
        // notify score/streak in case status changed elsewhere
        window.dispatchEvent(new CustomEvent("tasksChanged"));
      } catch (err) {
        console.error("Update failed:", err);
        alert("Failed to update task.");
      }
    } else {
      // new task
      const newTask = {
        text,
        due,
        status: task.status || "pending",
        priority: task.priority || "medium",
        reminder: task.reminder || "",
        reminderSent: false,
        uid: user.uid,
        createdAt: new Date().toISOString(),
        dueDate: due.slice(0, 10),
      };

      try {
        await addDoc(collection(db, "tasks"), newTask);
        // Notify score/streak recalculation
        window.dispatchEvent(new CustomEvent("tasksChanged"));

        // If created for other date (future), show toast + auto-switch
        if (newTask.dueDate !== sessionDate) {
          setFutureJumpMessage(newTask.dueDate);

          // small delay then switch (optional behavior: we auto-switch so user sees the created task)
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("switchDate", { detail: newTask.dueDate }));
          }, 400);
        }
      } catch (err) {
        console.error("Add task failed:", err);
        alert("Failed to create task.");
      }
    }
  }

  async function handleDelete(task) {
    try {
      await deleteDoc(doc(db, "tasks", task.id));
      window.dispatchEvent(new CustomEvent("tasksChanged"));
    } catch (err) {
      console.error("Delete failed:", err);
    }
  }

  async function markTaskStatus(task, status) {
    try {
      await updateDoc(doc(db, "tasks", task.id), { status });
      window.dispatchEvent(new CustomEvent("tasksChanged"));
    } catch (err) {
      console.error("Mark status failed:", err);
    }
  }

  function handleMarkComplete(task) {
    setTaskToComplete(task);
    setShowGratitudeModal(true);
  }

  async function confirmComplete(gratitude) {
    const t = taskToComplete;
    setShowGratitudeModal(false);
    setTaskToComplete(null);
    if (!t) return;
    try {
      await updateDoc(doc(db, "tasks", t.id), {
        status: "completed",
        gratitude,
        completedAt: new Date().toISOString(),
      });
      window.dispatchEvent(new CustomEvent("tasksChanged"));
    } catch (err) {
      console.error("Confirm complete failed:", err);
    }
  }

  function cancelComplete() {
    setShowGratitudeModal(false);
    setTaskToComplete(null);
  }

  // -------------------- AI PLANNER --------------------
  async function generatePlan() {
    setPlannerText("⏳ Generating AI plan...");
    setShowPlanner(true);

    try {
      const res = await fetch("/api/aiPlanner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tasks }),
      });

      const data = await res.json();
      setPlannerText(data.plan || "No output.");
    } catch (err) {
      setPlannerText("⚠️ Failed to generate plan.");
    }
  }

  // UI helpers: robust isToday/isFuture/isPast
  const todayMid = new Date();
  todayMid.setHours(0, 0, 0, 0);
  const selectedMid = getDateMidnightFromIso(sessionDate);

  const isToday = selectedMid.getTime() === todayMid.getTime();
  const isFuture = selectedMid.getTime() > todayMid.getTime();
  const isPast = selectedMid.getTime() < todayMid.getTime();

  if (loading) {
    return (
      <div style={{
        background: "#fff",
        borderRadius: 16,
        padding: "40px 20px",
        textAlign: "center",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        border: "1px solid rgba(102, 126, 234, 0.1)",
      }}>
        <div style={{
          width: 50, height: 50, border: "4px solid #f3f4f6", borderTop: "4px solid #667eea",
          borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 15px"
        }} />
        <div style={{ color: "#718096", fontSize: "1.1em" }}>Loading tasks...</div>
        <style>{`@keyframes spin {0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}`}</style>
      </div>
    );
  }

  return (
    <div style={{
      background: "#fff", borderRadius: 16, padding: "20px 16px",
      boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid rgba(102, 126, 234, 0.1)"
    }}>
      {/* Future-jump toast */}
      {futureJumpMessage && (
        <div style={{
          background: "#EBF4FF", border: "1px solid #90CDF4", padding: "12px 16px",
          borderRadius: 10, marginBottom: 15, display: "flex", justifyContent: "space-between",
          alignItems: "center", color: "#2C5282", fontWeight: 500
        }}>
          Task added for <strong style={{ margin: "0 8px" }}>{futureJumpMessage}</strong>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => {
              window.dispatchEvent(new CustomEvent("switchDate", { detail: futureJumpMessage }));
              setFutureJumpMessage(null);
            }} style={{
              background: "#2B6CB0", color: "#fff", padding: "6px 12px",
              borderRadius: 8, border: "none", cursor: "pointer", fontWeight: 600
            }}>
              Go to Task →
            </button>
            <button onClick={() => setFutureJumpMessage(null)} style={{
              background: "transparent", border: "none", color: "#2C5282", cursor: "pointer"
            }}>
              ×
            </button>
          </div>
        </div>
      )}

      <h3 style={{ fontWeight: 700, fontSize: "1.3em", marginBottom: 16, color: "#2d3748" }}>
        Tasks for {isToday ? "Today" : sessionDate}
        {isFuture && <span style={{ marginLeft: 10, fontSize: "0.7em", color: "#667eea", background: "#eff6ff", padding: "4px 10px", borderRadius: 6 }}>📆 Future</span>}
        {isPast && <span style={{ marginLeft: 10, fontSize: "0.7em", color: "#718096", background: "#edf2f7", padding: "4px 10px", borderRadius: 6 }}>📖 Past</span>}
      </h3>

      {/* Only show form for today and future dates */}
      {(isToday || isFuture) && (
        <TaskForm
          onAdd={handleAddOrEdit}
          tasks={tasks}
          editing={editing}
          onCancelEdit={() => setEditing(null)}
        />
      )}

      {/* AI Button - only for today with 2+ tasks */}
      {isToday && tasks.length >= 2 && (
        <button onClick={generatePlan} style={{
          background: "#4f46e5", color: "white", padding: "10px 18px", borderRadius: 8,
          fontWeight: 600, marginBottom: 20, border: "none", cursor: "pointer"
        }}>
          🔮 Generate AI Day Planner
        </button>
      )}

      {/* Task List */}
      {tasks.length === 0 ? (
        <div style={{ textAlign: "center", padding: 40, color: "#a0aec0", fontStyle: "italic" }}>📝 No tasks for this day</div>
      ) : (
        <TaskList
          tasks={tasks}
          onEdit={isToday || isFuture ? setEditing : undefined}
          onDelete={isToday || isFuture ? handleDelete : undefined}
          onMarkOngoing={isToday ? (t) => markTaskStatus(t, "ongoing") : undefined}
          onMarkComplete={isToday ? handleMarkComplete : undefined}
        />
      )}

      <GratitudeModal show={showGratitudeModal} taskText={taskToComplete?.text || ""} onConfirm={confirmComplete} onCancel={cancelComplete} />

      {showPlanner && (
        <div style={{ marginTop: 25, padding: 20, borderRadius: 12, background: "#f8f9ff", border: "1px solid #dadaff", whiteSpace: "pre-wrap" }}>
          <h3 style={{ fontWeight: 700, marginBottom: 12 }}>🧠 AI Day Planner</h3>
          <div style={{ fontSize: "0.95em", color: "#2d3748" }}>{plannerText}</div>
          <button onClick={() => setShowPlanner(false)} style={{ marginTop: 15, background: "#4a5568", color: "white", padding: "8px 16px", borderRadius: 6, border: "none", cursor: "pointer" }}>
            Hide Plan
          </button>
        </div>
      )}
    </div>
  );
}
