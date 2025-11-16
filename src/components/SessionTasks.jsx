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

function nowIST() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
}
function istMidnightFromIso(iso) {
  const d = new Date(iso);
  const ist = new Date(d.toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
  ist.setHours(0, 0, 0, 0);
  return ist;
}

export default function SessionTasks({ sessionDate, onTasksChange }) {
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  const [showGratitudeModal, setShowGratitudeModal] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState(null);

  const [plannerText, setPlannerText] = useState("");
  const [showPlanner, setShowPlanner] = useState(false);

  const [futureJumpMessage, setFutureJumpMessage] = useState(null);

  // completed section control (expanded by default)
  const [completedOpen, setCompletedOpen] = useState(true);

  const allTasksCache = useRef(null);
  const lastFetch = useRef(0);
  const unsubRef = useRef(null);

  const dateRange = useMemo(() => ({ startOfDay: sessionDate + "T00:00", endOfDay: sessionDate + "T23:59" }), [sessionDate]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    const now = Date.now();
    if (allTasksCache.current && allTasksCache.current.date === sessionDate && now - lastFetch.current < 30000) {
      setTasks(allTasksCache.current.tasks);
      setLoading(false);
      if (onTasksChange) onTasksChange(allTasksCache.current.tasks);
      return;
    }

    setLoading(true);
    if (unsubRef.current) {
      try { unsubRef.current(); } catch (e) {}
      unsubRef.current = null;
    }

    const q = query(
      collection(db, "tasks"),
      where("uid", "==", user.uid),
      where("due", ">=", dateRange.startOfDay),
      where("due", "<=", dateRange.endOfDay),
      orderBy("due", "asc")
    );

    const unsub = onSnapshot(q, (snap) => {
      const arr = snap.docs.map((d) => ({ ...d.data(), id: d.id }));
      setTasks(arr);
      allTasksCache.current = { date: sessionDate, tasks: arr };
      lastFetch.current = Date.now();
      if (onTasksChange) onTasksChange(arr);
      setLoading(false);
    }, (err) => {
      console.error("Realtime query failed:", err);
      setTasks([]);
      setLoading(false);
    });

    unsubRef.current = unsub;
    return () => {
      try { unsub(); } catch (e) {}
      unsubRef.current = null;
    };
  }, [sessionDate, user, onTasksChange, dateRange]);

  // helper to clear cache after any mutation
  function clearCache() {
    allTasksCache.current = null;
    lastFetch.current = 0;
  }

  // ---------- CRUD ----------
  async function handleAddOrEdit(task) {
    if (!user) return;

    const text = (task.text || "").trim();
    if (!text) return;
    const due = task.due;
    if (!due) return alert("Please select a due date/time.");

    // IST-based block for past
    const nowIst = nowIST();
    const selectedLocal = new Date(due);
    if (selectedLocal.getTime() < nowIst.getTime()) {
      return alert("You cannot add a task in the past (IST). Choose a future date/time.");
    }

    const taskDate = due.slice(0, 10);
    if (!taskDate) return alert("Invalid due date.");

    // Duplicate check
    if (allTasksCache.current && allTasksCache.current.date === taskDate) {
      const dup = allTasksCache.current.tasks.find((t) => t.text?.trim() === text && t.due?.slice(0, 10) === taskDate);
      if (dup && (!task.id || dup.id !== task.id)) {
        return alert("Duplicate task for the same day blocked.");
      }
    } else {
      try {
        const q = query(collection(db, "tasks"), where("uid", "==", user.uid), where("text", "==", text), limit(5));
        const snap = await getDocs(q);
        const found = snap.docs.map((d) => ({ ...d.data(), id: d.id })).find((t) => t.due?.slice(0, 10) === taskDate && (!task.id || t.id !== task.id));
        if (found) return alert("Duplicate task for the same day blocked.");
      } catch (err) {
        console.error("Duplicate check failed:", err);
      }
    }

    if (task.id) {
      try {
        await updateDoc(doc(db, "tasks", task.id), {
          ...task,
          text,
          due,
          dueDate: due.slice(0, 10),
          reminderValue: task.reminderValue ?? null,
          reminderUnit: task.reminderUnit ?? null,
          priority: task.priority ?? "medium",
        });
        clearCache();
        setEditing(null);
        window.dispatchEvent(new CustomEvent("tasksChanged"));
      } catch (err) {
        console.error("Update failed:", err);
        alert("Failed to update task.");
      }
    } else {
      const newTask = {
        text,
        due,
        status: task.status || "pending",
        priority: task.priority || "medium",
        reminderValue: task.reminderValue ?? null,
        reminderUnit: task.reminderUnit ?? null,
        reminderSent: false,
        uid: user.uid,
        createdAt: new Date().toISOString(),
        dueDate: due.slice(0, 10),
      };

      try {
        await addDoc(collection(db, "tasks"), newTask);
        clearCache();
        window.dispatchEvent(new CustomEvent("tasksChanged"));
        if (newTask.dueDate !== sessionDate) {
          setFutureJumpMessage(newTask.dueDate);
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("switchDate", { detail: newTask.dueDate }));
          }, 400);
        }
      } catch (err) {
        console.error("Add failed:", err);
        alert("Failed to create task.");
      }
    }
  }

  async function handleDelete(task) {
    try {
      await deleteDoc(doc(db, "tasks", task.id));
      clearCache();
      // ensure UI updates (listener will handle it, but we also remove locally for instant UX)
      setTasks((prev) => prev.filter((p) => p.id !== task.id));
      window.dispatchEvent(new CustomEvent("tasksChanged"));
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete task.");
    }
  }

  async function markTaskStatus(task, status) {
    try {
      await updateDoc(doc(db, "tasks", task.id), { status });
      clearCache();
      window.dispatchEvent(new CustomEvent("tasksChanged"));
    } catch (err) {
      console.error("Mark status failed:", err);
    }
  }

  function handleMarkComplete(task) {
    setTaskToComplete(task);
    setShowGratitudeModal(true);
  }

  // After user confirms gratitude: update task, then call AI reflection endpoint and update doc again
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
      clearCache();
      window.dispatchEvent(new CustomEvent("tasksChanged"));

      // Call reflection API (auto-generate)
      try {
        const res = await fetch("/api/taskReflection", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task: t.text, gratitude }),
        });
        const data = await res.json();
        const feedback = data.feedback || "";
        if (feedback) {
          await updateDoc(doc(db, "tasks", t.id), { reflectionFeedback: feedback });
          clearCache();
          window.dispatchEvent(new CustomEvent("tasksChanged"));
        }
      } catch (aiErr) {
        console.error("Reflection generation failed:", aiErr);
      }
    } catch (err) {
      console.error("Confirm complete failed:", err);
      alert("Failed to complete task.");
    }
  }

  // AI planner
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

  // UI derived lists
  const activeTasks = tasks.filter((t) => t.status !== "completed");
  const completedTasks = tasks.filter((t) => t.status === "completed");

  const todayMid = nowIST();
  todayMid.setHours(0, 0, 0, 0);
  const selectedMid = istMidnightFromIso(sessionDate);

  const isToday = selectedMid.getTime() === todayMid.getTime();
  const isFuture = selectedMid.getTime() > todayMid.getTime();
  const isPast = selectedMid.getTime() < todayMid.getTime();

  if (loading) {
    return (
      <div style={{ background: "#fff", borderRadius: 16, padding: "40px 20px", textAlign: "center", boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid rgba(102,126,234,0.08)" }}>
        <div style={{ width: 50, height: 50, border: "4px solid #f3f4f6", borderTop: "4px solid #667eea", borderRadius: "50%", animation: "spin 1s linear infinite", margin: "0 auto 15px" }} />
        <div style={{ color: "#718096", fontSize: "1.05em" }}>Loading tasks...</div>
        <style>{`@keyframes spin {0%{transform:rotate(0deg);}100%{transform:rotate(360deg);}}`}</style>
      </div>
    );
  }

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: 16, boxShadow: "0 4px 20px rgba(0,0,0,0.08)", border: "1px solid rgba(102,126,234,0.08)" }}>
      {/* Future toast */}
      {futureJumpMessage && (
        <div style={{ background: "#f0f9ff", padding: 12, borderRadius: 10, marginBottom: 12, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          🎉 Task added for <strong style={{ marginLeft: 8 }}>{futureJumpMessage}</strong>
          <div style={{ display: "flex", gap: 8 }}>
            <button onClick={() => { window.dispatchEvent(new CustomEvent("switchDate", { detail: futureJumpMessage })); setFutureJumpMessage(null); }} style={{ background: "#2b6cb0", color: "#fff", borderRadius: 8, padding: "6px 10px", border: "none" }}>Go to Task →</button>
            <button onClick={() => setFutureJumpMessage(null)} style={{ background: "transparent", border: "none", fontSize: 18 }}>×</button>
          </div>
        </div>
      )}

      <h3 style={{ fontWeight: 700, fontSize: "1.25em", marginBottom: 12 }}>Tasks for {isToday ? "Today" : sessionDate} {isFuture && <span style={{ marginLeft: 8 }}>📆</span>} {isPast && <span style={{ marginLeft: 8 }}>📖</span>}</h3>

      {(isToday || isFuture) && <TaskForm onAdd={handleAddOrEdit} tasks={tasks} editing={editing} onCancelEdit={() => setEditing(null)} />}

      {isToday && tasks.length >= 2 && <button onClick={generatePlan} style={{ background: "#5b21b6", color: "#fff", padding: "8px 12px", borderRadius: 8, border: "none", marginBottom: 12 }}>🔮 Generate AI Day Planner</button>}

      <div style={{ marginTop: 8 }}>
        <div style={{ fontWeight: 700, marginBottom: 8, display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>📝 Active Tasks ({activeTasks.length})</div>
        </div>

        {activeTasks.length === 0 ? <div style={{ padding: 16, color: "#94a3b8" }}>No active tasks</div> : <TaskList tasks={activeTasks} onEdit={isToday || isFuture ? setEditing : undefined} onDelete={isToday || isFuture ? handleDelete : undefined} onMarkOngoing={isToday ? (t) => markTaskStatus(t, "ongoing") : undefined} onMarkComplete={isToday ? handleMarkComplete : undefined} />}
      </div>

      {/* Completed */}
      <div style={{ marginTop: 16 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ fontWeight: 700 }}>✅ Completed Tasks ({completedTasks.length})</div>
          <div>
            <button onClick={() => setCompletedOpen(!completedOpen)} style={{ padding: "6px 10px", borderRadius: 8, background: "#eef2ff", border: "none", cursor: "pointer" }}>
              {completedOpen ? "Hide ▲" : "Show ▼"}
            </button>
          </div>
        </div>

        {completedOpen && (
          <div style={{ marginTop: 10 }}>
            {completedTasks.length === 0 ? <div style={{ padding: 12, color: "#94a3b8" }}>No completed tasks yet</div> : <TaskList tasks={completedTasks} onDelete={isToday || isFuture ? handleDelete : undefined} />}
          </div>
        )}
      </div>

      <GratitudeModal show={showGratitudeModal} taskText={taskToComplete?.text || ""} onConfirm={confirmComplete} onCancel={() => { setShowGratitudeModal(false); setTaskToComplete(null); }} />

      {showPlanner && (
        <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: "#f8f9ff" }}>
          <h4 style={{ margin: 0 }}>🧠 AI Day Planner</h4>
          <pre style={{ whiteSpace: "pre-wrap", marginTop: 8 }}>{plannerText}</pre>
          <button onClick={() => setShowPlanner(false)} style={{ marginTop: 8, background: "#475569", color: "#fff", border: "none", padding: "6px 10px", borderRadius: 8 }}>Hide</button>
        </div>
      )}
    </div>
  );
}
