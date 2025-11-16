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
  const [error, setError] = useState(null);

  const allTasksCache = useRef(null);
  const lastFetchTime = useRef(0);
  const unsubscribeRef = useRef(null);

  const dateRange = useMemo(() => {
    const startOfDay = sessionDate + "T00:00";
    const endOfDay = sessionDate + "T23:59";
    return { startOfDay, endOfDay };
  }, [sessionDate]);

  // Load tasks
  useEffect(() => {
    if (!user || !user.emailVerified) {
      setLoading(false);
      setError("Email verification required to access tasks.");
      return;
    }

    const now = Date.now();

    // Use cached tasks if fresh (<30s)
    if (allTasksCache.current && now - lastFetchTime.current < 30000) {
      const filtered = allTasksCache.current.filter(
        (task) => task.due?.slice(0, 10) === sessionDate
      );
      setTasks(filtered);
      setLoading(false);
      if (onTasksChange) onTasksChange(filtered);
      return;
    }

    setLoading(true);
    setError(null);

    // Clean previous listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    const { startOfDay, endOfDay } = dateRange;

    // Primary query (requires index)
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
        lastFetchTime.current = Date.now();
        if (onTasksChange) onTasksChange(t);
        setLoading(false);
      },
      async (err) => {
        console.error("Firestore error:", err);

        // Fallback: load all tasks
        if (err.code === "failed-precondition") {
          try {
            const allQuery = query(
              collection(db, "tasks"),
              where("uid", "==", user.uid)
            );

            const snapshot = await getDocs(allQuery);
            const allTasks = snapshot.docs.map((doc) => ({
              ...doc.data(),
              id: doc.id,
            }));

            allTasksCache.current = allTasks;
            lastFetchTime.current = Date.now();

            const filtered = allTasks.filter(
              (task) => task.due?.slice(0, 10) === sessionDate
            );

            setTasks(filtered);
            setLoading(false);
            if (onTasksChange) onTasksChange(filtered);

            // Realtime listener
            const realtimeQuery = query(
              collection(db, "tasks"),
              where("uid", "==", user.uid)
            );

            const realtimeUnsub = onSnapshot(realtimeQuery, (snap) => {
              const updated = snap.docs.map((doc) => ({
                ...doc.data(),
                id: doc.id,
              }));

              allTasksCache.current = updated;
              lastFetchTime.current = Date.now();

              const filteredUpdated = updated.filter(
                (task) => task.due?.slice(0, 10) === sessionDate
              );

              setTasks(filteredUpdated);
              if (onTasksChange) onTasksChange(filteredUpdated);
            });

            unsubscribeRef.current = realtimeUnsub;
          } catch (err2) {
            console.error("Fallback error:", err2);
            setError("Failed to load tasks.");
            setLoading(false);
          }
        } else {
          setError("Failed to load tasks.");
          setLoading(false);
        }
      }
    );

    unsubscribeRef.current = unsub;

    return () => {
      if (unsub) unsub();
    };
  }, [sessionDate, user, onTasksChange, dateRange]);

  // CRUD
  async function handleAddOrEdit(task) {
    if (!user?.emailVerified) {
      setError("Email verification required.");
      return;
    }

    try {
      if (editing) {
        setTasks((prev) =>
          prev.map((t) => (t.id === editing.id ? { ...t, ...task } : t))
        );

        await updateDoc(doc(db, "tasks", task.id), {
          text: task.text,
          due: task.due,
          status: task.status,
          priority: task.priority || "medium",
          reminder: task.reminder || "",
          reminderSent: false,
          uid: user.uid,
        });

        if (allTasksCache.current) {
          allTasksCache.current = allTasksCache.current.map((t) =>
            t.id === task.id ? { ...t, ...task } : t
          );
        }

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

        const docRef = await addDoc(collection(db, "tasks"), newTask);
        const taskWithId = { ...newTask, id: docRef.id };

        setTasks((prev) => [...prev, taskWithId]);

        if (allTasksCache.current) {
          allTasksCache.current.push(taskWithId);
        }
      }

      setError(null);
    } catch (err) {
      console.error("Error saving task:", err);
      setError("Failed to save task.");
    }
  }

  async function handleDelete(task) {
    if (!user?.emailVerified) {
      setError("Email verification required.");
      return;
    }

    try {
      setTasks((prev) => prev.filter((t) => t.id !== task.id));
      await deleteDoc(doc(db, "tasks", task.id));

      if (allTasksCache.current) {
        allTasksCache.current = allTasksCache.current.filter(
          (t) => t.id !== task.id
        );
      }

      setError(null);
    } catch (err) {
      console.error("Error deleting:", err);
      setError("Failed to delete task.");
    }
  }

  async function markTaskStatus(task, status) {
    if (!user?.emailVerified) {
      setError("Email verification required.");
      return;
    }

    try {
      setTasks((prev) =>
        prev.map((t) => (t.id === task.id ? { ...t, status } : t))
      );

      await updateDoc(doc(db, "tasks", task.id), { status });

      if (allTasksCache.current) {
        allTasksCache.current = allTasksCache.current.map((t) =>
          t.id === task.id ? { ...t, status } : t
        );
      }
    } catch (err) {
      console.error("Error updating status:", err);
      setError("Failed to update task.");
    }
  }

  function handleMarkComplete(task) {
    setTaskToComplete(task);
    setShowGratitudeModal(true);
  }

  // FIXED — Close modal BEFORE Firestore update
  async function confirmComplete(gratitude) {
    if (!user?.emailVerified) {
      setError("Email verification required.");
      return;
    }

    const task = taskToComplete;

    // IMPORTANT: Close modal first to stop popup loop
    setShowGratitudeModal(false);
    setTaskToComplete(null);

    try {
      setTasks((prev) =>
        prev.map((t) =>
          t.id === task.id ? { ...t, status: "completed", gratitude } : t
        )
      );

      if (allTasksCache.current) {
        allTasksCache.current = allTasksCache.current.map((t) =>
          t.id === task.id ? { ...t, status: "completed", gratitude } : t
        );
      }

      await updateDoc(doc(db, "tasks", task.id), {
        status: "completed",
        gratitude,
        completedAt: new Date().toISOString(),
      });

      setError(null);
    } catch (err) {
      console.error("Error completing task:", err);
      setError("Failed to complete task.");
    }
  }

  function cancelComplete() {
    setShowGratitudeModal(false);
    setTaskToComplete(null);
  }

  const todayStr = new Date().toISOString().slice(0, 10);
  const isToday = sessionDate === todayStr;

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        minHeight: 210,
        padding: "20px 16px 24px",
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
      }}
    >
      <h3
        style={{
          marginBottom: 16,
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
            fontSize: "1.05em",
            padding: "40px 20px",
            fontStyle: "italic",
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
