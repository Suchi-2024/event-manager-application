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
} from "firebase/firestore";

import TaskList from "./TaskList";
import TaskForm from "./TaskForm";
import GratitudeModal from "./GratitudeModal";
import Toast from "./Toast";
import { useAuth } from "./AuthProvider";

/* IST helpers */
function nowIST() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
}

function istMidnightFromIso(isoDateStr) {
  // isoDateStr may be "YYYY-MM-DD"
  const d = new Date(isoDateStr + "T00:00:00");
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
  const [completedOpen, setCompletedOpen] = useState(true);

  const [toast, setToast] = useState("");
  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 2200);
  };

  // keep a stable ref to unsubscribe function
  const unsubRef = useRef(null);

  const dateRange = useMemo(() => ({ startOfDay: sessionDate + "T00:00", endOfDay: sessionDate + "T23:59" }), [sessionDate]);

  // Real-time listener (no broken caching)
  useEffect(() => {
    if (!user) {
      setLoading(false);
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

  // ---------- CRUD with optimistic updates ----------

  // Helper to format IST-local due string is handled by TaskForm; we accept due as "YYYY-MM-DDTHH:MM"
  async function handleAddOrEdit(task) {
    if (!user) return;

    const text = (task.text || "").trim();
    if (!text) return;
    const due = task.due;
    if (!due) return showToast("Please select a due date/time.");

    // IST validation: parse due string as IST local instant
    const [datePart, timePart] = due.split("T");
    if (!datePart || !timePart) return showToast("Invalid due format.");
    const [y, m, d] = datePart.split("-").map(Number);
    const [hh, mm] = timePart.split(":").map(Number);
    // Build IST instant:
    const istInstant = new Date(Date.UTC(y, m - 1, d, hh - 5, mm - 30));
    if (istInstant.getTime() < nowIST().getTime()) {
      return showToast("Cannot add a task in the past (IST).");
    }

    if (task.id) {
      // editing: optimistic update + server update
      setTasks(prev => prev.map(t => t.id === task.id ? { ...t, ...task, text, due } : t));
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
        showToast("Task updated ✓");
        window.dispatchEvent(new CustomEvent("tasksChanged"));
        setEditing(null);
      } catch (err) {
        console.error("Update failed:", err);
        showToast("Failed to update task.");
      }
    } else {
      // new task: optimistic insert with temp id
      const tempId = "temp-" + Date.now();
      const newTask = {
        id: tempId,
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

      // optimistic UI add
      setTasks(prev => [newTask, ...prev]);
      showToast("Adding task...");

      try {
        const docRef = await addDoc(collection(db, "tasks"), {
          text: newTask.text,
          due: newTask.due,
          status: newTask.status,
          priority: newTask.priority,
          reminderValue: newTask.reminderValue,
          reminderUnit: newTask.reminderUnit,
          reminderSent: false,
          uid: user.uid,
          createdAt: new Date().toISOString(),
          dueDate: newTask.dueDate,
        });

        // replace temp id with real id in UI
        setTasks(prev => prev.map(t => t.id === tempId ? { ...t, id: docRef.id } : t));
        showToast("Task added ✓");
        window.dispatchEvent(new CustomEvent("tasksChanged"));

        if (newTask.dueDate !== sessionDate) {
          setFutureJumpMessage(newTask.dueDate);
          setTimeout(() => {
            window.dispatchEvent(new CustomEvent("switchDate", { detail: newTask.dueDate }));
          }, 400);
        }
      } catch (err) {
        console.error("Add failed:", err);
        // rollback optimistic add
        setTasks(prev => prev.filter(t => t.id !== tempId));
        showToast("Failed to create task.");
      }
    }
  }

  async function handleDelete(task) {
    if (!task?.id) return;
    // optimistic remove
    setTasks(prev => prev.filter(t => t.id !== task.id));
    showToast("Deleting...");
    try {
      await deleteDoc(doc(db, "tasks", task.id));
      showToast("Task deleted 🗑️");
      window.dispatchEvent(new CustomEvent("tasksChanged"));
    } catch (err) {
      console.error("Delete failed:", err);
      showToast("Failed to delete task.");
      // try to re-fetch quickly: we'll re-add by forcing a snapshot reload by toggling sessionDate event
      // (or you can re-fetch from server)
    }
  }

  async function markTaskStatus(task, status) {
    if (!task?.id) return;
    // optimistic
    setTasks(prev => prev.map(t => t.id === task.id ? { ...t, status } : t));
    showToast(status === "ongoing" ? "Marked ongoing" : "Updating...");
    try {
      await updateDoc(doc(db, "tasks", task.id), { status });
      showToast(status === "ongoing" ? "Marked ongoing ✓" : "Updated ✓");
      window.dispatchEvent(new CustomEvent("tasksChanged"));
    } catch (err) {
      console.error("Mark status failed:", err);
      showToast("Failed to update status.");
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

    // immediate optimistic UI update
    setTasks(prev => prev.map(x => x.id === t.id ? { ...x, status: "completed", gratitude, completedAt: new Date().toISOString() } : x));
    showToast("Completing...");

    try {
      // 1) mark as completed
      await updateDoc(doc(db, "tasks", t.id), {
        status: "completed",
        gratitude,
        completedAt: new Date().toISOString(),
      });

      // 2) call reflection endpoint (Gemini) — auto-generate
      try {
        const res = await fetch("/api/taskReflection", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ task: t.text, gratitude }),
        });

        if (res.ok) {
          const data = await res.json();
          const feedback = data.feedback || "";
          if (feedback) {
            // save reflection back to doc
            await updateDoc(doc(db, "tasks", t.id), { reflectionFeedback: feedback });
            // update UI optimistically
            setTasks(prev => prev.map(x => x.id === t.id ? { ...x, reflectionFeedback: feedback } : x));
            showToast("Task completed ✨");
            window.dispatchEvent(new CustomEvent("tasksChanged"));
          } else {
            showToast("Task completed (no reflection).");
          }
        } else {
          console.error("Reflection API error:", await res.text());
          showToast("Task completed (reflection failed).");
        }
      } catch (aiErr) {
        console.error("Reflection generation failed:", aiErr);
        showToast("Task completed (reflection failed).");
      }
    } catch (err) {
      console.error("Confirm complete failed:", err);
      showToast("Failed to complete task.");
    }
  }

  // AI planner (no changes)
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

        {activeTasks.length === 0 ? <div style={{ padding: 16, color: "#94a3b8" }}>No active tasks</div> : <TaskList tasks={activeTasks} onEdit={isToday || isFuture ? setEditing : undefined} onDelete={handleDelete} onMarkOngoing={isToday ? (t) => markTaskStatus(t, "ongoing") : undefined} onMarkComplete={isToday ? handleMarkComplete : undefined} />}
      </div>

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
            {completedTasks.length === 0 ? <div style={{ padding: 12, color: "#94a3b8" }}>No completed tasks yet</div> : <TaskList tasks={completedTasks} onDelete={handleDelete} />}
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

      <Toast message={toast} />
    </div>
  );
}
