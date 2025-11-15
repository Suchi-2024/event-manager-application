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

  // 🔥 FIX: Load ALL user's tasks, then filter by date in JS
  useEffect(() => {
    if (!user || !user.emailVerified) {
      setLoading(false);
      setError("Email verification required to access tasks.");
      return;
    }

    setLoading(true);
    setError(null);

    const q = query(
      collection(db, "tasks"),
      where("uid", "==", user.uid),
      orderBy("due", "asc")
    );

    const unsub = onSnapshot(
      q,
      (snap) => {
        const allTasks = snap.docs.map((doc) => ({
          ...doc.data(),
          id: doc.id,
        }));

        const filtered = allTasks.filter((task) =>
          task.due?.slice(0, 10) === sessionDate
        );

        setTasks(filtered);
        setLoading(false);

        if (onTasksChange) onTasksChange(filtered);
      },
      (err) => {
        console.error("Firestore error:", err);
        setError("Failed to load tasks. Please try again.");
        setLoading(false);
      }
    );

    return unsub;
  }, [sessionDate, user, onTasksChange]);

  // ----------- CRUD METHODS ------------ //

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
    try {
      await deleteDoc(doc(db, "tasks", task.id));
    } catch (err) {
      console.error("Error deleting task:", err);
      setError("Failed to delete task.");
    }
  }

  async function markTaskStatus(task, status) {
    try {
      await updateDoc(doc(db, "tasks", task.id), { status });
    } catch (err) {
      console.error("Error updating task:", err);
      setError("Failed to update task.");
    }
  }

  function handleMarkComplete(task) {
    setTaskToComplete(task);
    setShowGratitudeModal(true);
  }

  async function confirmComplete(gratitude) {
    if (taskToComplete) {
      try {
        await updateDoc(doc(db, "tasks", taskToComplete.id), {
          status: "completed",
          gratitude,
          completedAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error("Error completing task:", err);
        setError("Failed to complete task.");
      }
    }
    setShowGratitudeModal(false);
    setTaskToComplete(null);
  }

  function cancelComplete() {
    setShowGratitudeModal(false);
    setTaskToComplete(null);
  }

  // UI RENDER
  const todayStr = new Date().toISOString().slice(0, 10);
  const isToday = sessionDate === todayStr;

  if (loading) {
    return (
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: 40,
          textAlign: "center",
        }}
      >
        <div
          style={{
            width: 50,
            height: 50,
            border: "4px solid #eee",
            borderTop: "4px solid #667eea",
            borderRadius: "50%",
            animation: "spin 1s linear infinite",
            margin: "0 auto 10px",
          }}
        />
        Loading...
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
          padding: 20,
          borderRadius: 16,
          border: "2px solid #fc8181",
          textAlign: "center",
          color: "#c53030",
        }}
      >
        ⚠️ {error}
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        padding: 24,
        minHeight: 210,
      }}
    >
      <h3
        style={{
          margin: "0 0 16px 0",
          fontWeight: 700,
          fontSize: "1.3em",
          color: "#2d3748",
        }}
      >
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

      {tasks.length === 0 ? (
        <div
          style={{
            textAlign: "center",
            color: "#a0aec0",
            fontStyle: "italic",
            padding: 40,
          }}
        >
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

      <GratitudeModal
        show={showGratitudeModal}
        taskText={taskToComplete?.text || ""}
        onConfirm={confirmComplete}
        onCancel={cancelComplete}
      />
    </div>
  );
}
