import React, { useEffect, useState } from "react";
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
import { useAuth } from "./AuthProvider";

export default function SessionTasks({ sessionDate, onTasksChange }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showGratitudeModal, setShowGratitudeModal] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState(null);
  const [error, setError] = useState(null);

  // Load tasks for ONLY the selected date & user
  useEffect(() => {
    if (!user || !user.emailVerified) {
      setLoading(false);
      setError("Email verification required to access tasks.");
      return;
    }

    setLoading(true);
    setError(null);

    const startOfDay = sessionDate + "T00:00";
    const endOfDay = sessionDate + "T23:59";

    const q = query(
      collection(db, "tasks"),
      where("uid", "==", user.uid),
      where("due", ">=", startOfDay),
      where("due", "<=", endOfDay),
      orderBy("due", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const t = snap.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
        setTasks(t);
        setLoading(false);
        if (onTasksChange) onTasksChange(t);
      },
      (err) => {
        console.error("Firestore error:", err);

        if (err.code === "failed-precondition") {
          setError(
            "Database index is building. Please wait 2-5 minutes and refresh."
          );
          console.error(
            "Index still building. Check Firebase console or click the link in the error above."
          );
        } else if (err.code === "permission-denied") {
          setError("Permission denied. Please verify your email.");
        } else {
          setError("Failed to load tasks. Please try again.");
        }
        setLoading(false);
      }
    );

    return unsub;
  }, [sessionDate, user, onTasksChange]);

  // CRUD Actions
  async function handleAddOrEdit(task) {
    if (!user?.emailVerified) {
      setError("Email verification required to manage tasks.");
      return;
    }

    try {
      if (editing) {
        await updateDoc(doc(db, "tasks", task.id), {
          ...task,
          uid: user.uid,
        });
        setEditing(null);
      } else {
        await addDoc(collection(db, "tasks"), {
          ...task,
          due: task.due,
          status: task.status || "pending",
          uid: user.uid,
          createdAt: new Date().toISOString(),
        });
      }
      setError(null);
    } catch (err) {
      console.error("Error saving task:", err);
      setError("Failed to save task. Please try again.");
    }
  }

  async function handleDelete(task) {
    if (!user?.emailVerified) {
      setError("Email verification required to delete tasks.");
      return;
    }

    try {
      await deleteDoc(doc(db, "tasks", task.id));
      setError(null);
    } catch (err) {
      console.error("Error deleting task:", err);
      setError("Failed to delete task. Please try again.");
    }
  }

  async function markTaskStatus(task, status) {
    if (!user?.emailVerified) {
      setError("Email verification required to update tasks.");
      return;
    }

    try {
      await updateDoc(doc(db, "tasks", task.id), { status });
      setError(null);
    } catch (err) {
      console.error("Error updating task:", err);
      setError("Failed to update task. Please try again.");
    }
  }

  function handleMarkComplete(task) {
    if (!user?.emailVerified) {
      setError("Email verification required to complete tasks.");
      return;
    }
    setTaskToComplete(task);
    setShowGratitudeModal(true);
  }

  async function confirmComplete(gratitude) {
    if (!user?.emailVerified) {
      setError("Email verification required to complete tasks.");
      setShowGratitudeModal(false);
      setTaskToComplete(null);
      return;
    }

    if (taskToComplete) {
      try {
        await updateDoc(doc(db, "tasks", taskToComplete.id), {
          status: "completed",
          gratitude: gratitude,
          completedAt: new Date().toISOString(),
        });
        setError(null);
      } catch (err) {
        console.error("Error completing task:", err);
        setError("Failed to complete task. Please try again.");
      }
    }
    setShowGratitudeModal(false);
    setTaskToComplete(null);
  }

  function cancelComplete() {
    setShowGratitudeModal(false);
    setTaskToComplete(null);
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  if (loading) {
    return (
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "40px",
          textAlign: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
          border: "1px solid rgba(102, 126, 234, 0.1)",
        }}
      >
        <div
          style={{
            width: 50,
            height: 50,
            border: "4px solid #f3f4f6",
            borderTop: "4px solid #667eea",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 15px",
          }}
        />
        <div style={{ color: "#718096", fontSize: "1.1em" }}>
          Loading tasks...
        </div>
        <style>
          {`
            @keyframes spin {
              0% { transform: rotate(0deg); }
              100% { transform: rotate(360deg); }
            }
          `}
        </style>
      </div>
    );
  }

  if (error) {
    return (
      <div
        style={{
          background: "#fff3f3",
          borderRadius: 16,
          padding: 20,
          border: "2px solid #fc8181",
          color: "#c53030",
          textAlign: "center",
          boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        }}
      >
        <div style={{ fontSize: "2em", marginBottom: 10 }}>⚠️</div>
        <div style={{ fontWeight: 600, marginBottom: 8 }}>{error}</div>
        {error.includes("index") && (
          <div style={{ fontSize: "0.9em", marginTop: 10, color: "#718096" }}>
            Check the browser console for the index creation link
          </div>
        )}
      </div>
    );
  }

  const isToday = sessionDate === todayStr;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        minHeight: 210,
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        padding: "24px",
        border: "1px solid rgba(102, 126, 234, 0.1)",
      }}
    >
      <h3
        style={{
          margin: 0,
          marginBottom: 16,
          fontWeight: 700,
          fontSize: "1.3em",
          color: "#2d3748",
        }}
      >
        Tasks for {sessionDate === todayStr ? "Today" : sessionDate}
      </h3>
      {isToday && (
        <TaskForm
          onAdd={handleAddOrEdit}
          tasks={tasks}
          editing={editing}
          onCancelEdit={() => setEditing(null)}
        />
      )}
      {tasks.length === 0 ? (
        <div
          style={{
            fontStyle: "italic",
            color: "#a0aec0",
            marginTop: 24,
            textAlign: "center",
            fontSize: "1.05em",
            padding: "40px 20px",
          }}
        >
          📝 No tasks for this day
        </div>
      ) : (
        <TaskList
          tasks={tasks}
          onEdit={isToday ? setEditing : undefined}
          onDelete={isToday ? handleDelete : undefined}
          onMarkOngoing={
            isToday ? (t) => markTaskStatus(t, "ongoing") : undefined
          }
          onMarkComplete={isToday ? handleMarkComplete : undefined}
        />
      )}

      <GratitudeModal
        show={showGratitudeModal}
        taskText={taskToComplete?.text || ""}
        onConfirm={confirmComplete}
        onCancel={cancelComplete}
      />
    </div>
  );
}
```

## What to Check:

1. **Index Status**: Go to Firebase Console → Firestore → Indexes tab
   - Your index should show as "Enabled" (green)
   - If it says "Building", wait 2-5 minutes

2. **Index Configuration Should Be**:
```
   Collection: tasks
   Fields indexed: 
     - uid (Ascending)
     - due (Ascending)
   Status: Enabled
