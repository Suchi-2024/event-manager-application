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

  const allTasksCache = useRef(null);
  const lastFetch = useRef(0);
  const unsubRef = useRef(null);

  const dateRange = useMemo(
    () => ({
      startOfDay: sessionDate + "T00:00",
      endOfDay: sessionDate + "T23:59",
    }),
    [sessionDate]
  );

  // -------------------- LOAD TASKS --------------------
  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const now = Date.now();

    if (allTasksCache.current && now - lastFetch.current < 30000) {
      const filtered = allTasksCache.current.filter(
        (t) => t.due?.slice(0, 10) === sessionDate
      );
      setTasks(filtered);
      setLoading(false);
      if (onTasksChange) onTasksChange(filtered);
      return;
    }

    setLoading(true);
    if (unsubRef.current) unsubRef.current();

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
        allTasksCache.current = arr;
        if (onTasksChange) onTasksChange(arr);
        setLoading(false);
      },
      async () => {
        const fullQuery = query(
          collection(db, "tasks"),
          where("uid", "==", user.uid)
        );
        const docs = await getDocs(fullQuery);
        const arr = docs.docs.map((d) => ({ ...d.data(), id: d.id }));
        allTasksCache.current = arr;

        const filtered = arr.filter(
          (t) => t.due?.slice(0, 10) === sessionDate
        );
        setTasks(filtered);
        if (onTasksChange) onTasksChange(filtered);
        setLoading(false);
      }
    );

    unsubRef.current = unsub;
    return () => unsub();
  }, [sessionDate, user]);

  // -------------------- CRUD --------------------
  async function handleAddOrEdit(task) {
  if (!user) return;

  if (editing) {
    await updateDoc(doc(db, "tasks", task.id), task);
    setEditing(null);
} else {
    const newTask = {
      text: task.text.trim(),
      due: task.due,
      status: task.status || "pending",
      priority: task.priority || "medium",
      reminder: task.reminder || "",
      reminderSent: false,
      uid: user.uid,
      createdAt: new Date().toISOString(),
    };
    
    await addDoc(collection(db, "tasks"), newTask);
    
    // Extract the date from the task's due date
    const taskDate = task.due.slice(0, 10);
    const currentSessionDate = sessionDate;
    
    // If task is for a different date, offer to switch
    if (taskDate !== currentSessionDate) {
      // Dispatch event to parent to change date
      window.dispatchEvent(
        new CustomEvent('switchDate', { detail: taskDate })
      );
    }
  }
}

  async function handleDelete(task) {
    await deleteDoc(doc(db, "tasks", task.id));
  }

  async function markTaskStatus(task, status) {
    await updateDoc(doc(db, "tasks", task.id), { status });
  }

  function handleMarkComplete(task) {
    setTaskToComplete(task);
    setShowGratitudeModal(true);
  }

  async function confirmComplete(gratitude) {
    const t = taskToComplete;
    setShowGratitudeModal(false);
    setTaskToComplete(null);

    await updateDoc(doc(db, "tasks", t.id), {
      status: "completed",
      gratitude,
      completedAt: new Date().toISOString(),
    });
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

  // -------------------- UI --------------------
  const today = new Date().toISOString().slice(0, 10);
  const isToday = sessionDate === today;

  return (
    <div style={{ background: "#fff", borderRadius: 16, padding: "20px 16px" }}>
      <h3 style={{ fontWeight: 700, fontSize: "1.3em", marginBottom: 16 }}>
        Tasks for {isToday ? "Today" : sessionDate}
      </h3>

      {isToday && (
        <TaskForm
          onAdd={handleAddOrEdit}
          tasks={tasks}
          editing={editing}
          onCancelEdit={() => setEditing(null)}
        />
      )}

      {/* AI Button */}
      {tasks.length >= 2 && (
        <button
          onClick={generatePlan}
          style={{
            background: "#4f46e5",
            color: "white",
            padding: "10px 18px",
            borderRadius: 8,
            fontWeight: 600,
            marginBottom: 20,
          }}
        >
          🔮 Generate AI Day Planner
        </button>
      )}

      {/* Task List */}
      {tasks.length === 0 ? (
        <div style={{ textAlign: "center", padding: 30, color: "#999" }}>
          📝 No tasks for this day
        </div>
      ) : (
        <TaskList
          tasks={tasks}
          onEdit={isToday ? setEditing : undefined}
          onDelete={isToday ? handleDelete : undefined}
          onMarkOngoing={isToday ? (t) => markTaskStatus(t, "ongoing") : undefined}
          onMarkComplete={isToday ? handleMarkComplete : undefined}
        />
      )}

      {/* Gratitude Modal */}
      <GratitudeModal
        show={showGratitudeModal}
        taskText={taskToComplete?.text || ""}
        onConfirm={confirmComplete}
        onCancel={cancelComplete}
      />

      {/* INLINE AI PLANNER RESULT */}
      {showPlanner && (
        <div
          style={{
            marginTop: 25,
            padding: 20,
            borderRadius: 12,
            background: "#f8f9ff",
            border: "1px solid #dadaff",
            whiteSpace: "pre-wrap",
          }}
        >
          <h3 style={{ fontWeight: 700, marginBottom: 12 }}>🧠 AI Day Planner</h3>

          <div style={{ fontSize: "0.95em", color: "#2d3748" }}>
            {plannerText}
          </div>

          <button
            onClick={() => setShowPlanner(false)}
            style={{
              marginTop: 15,
              background: "#4a5568",
              color: "white",
              padding: "8px 16px",
              borderRadius: 6,
            }}
          >
            Hide Plan
          </button>
        </div>
      )}
    </div>
  );
}

