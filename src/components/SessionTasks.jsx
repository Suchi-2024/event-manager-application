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

  // Cache all user tasks once
  const allTasksCache = useRef(null);
  const lastFetchTime = useRef(0);
  const unsubscribeRef = useRef(null);

  // Memoize date range for the query
  const dateRange = useMemo(() => {
    const startOfDay = sessionDate + "T00:00";
    const endOfDay = sessionDate + "T23:59";
    return { startOfDay, endOfDay };
  }, [sessionDate]);

  useEffect(() => {
    if (!user || !user.emailVerified) {
      setLoading(false);
      setError("Email verification required to access tasks.");
      return;
    }

    const now = Date.now();
    
    // If we have cached data and it's less than 30 seconds old, use cache
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

    // Clean up previous listener
    if (unsubscribeRef.current) {
      unsubscribeRef.current();
    }

    // OPTION 1: Try date range query first (requires composite index)
    const { startOfDay, endOfDay } = dateRange;
    
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
        lastFetchTime.current = Date.now();

        if (onTasksChange) onTasksChange(t);
      },
      async (err) => {
        console.error("Firestore error:", err);

        // If composite index is missing, fall back to loading all tasks
        if (err.code === "failed-precondition") {
          console.warn("Composite index missing, falling back to full query...");
          
          try {
            // Load ALL tasks once using getDocs (one-time read)
            const allTasksQuery = query(
              collection(db, "tasks"),
              where("uid", "==", user.uid)
            );
            
            const snapshot = await getDocs(allTasksQuery);
            const allTasks = snapshot.docs.map((doc) => ({
              ...doc.data(),
              id: doc.id,
            }));

            // Cache all tasks
            allTasksCache.current = allTasks;
            lastFetchTime.current = Date.now();

            // Filter by date in JavaScript
            const filtered = allTasks.filter(
              (task) => task.due?.slice(0, 10) === sessionDate
            );

            setTasks(filtered);
            setLoading(false);

            if (onTasksChange) onTasksChange(filtered);

            // Set up real-time listener for all tasks
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
          } catch (fallbackErr) {
            console.error("Fallback query error:", fallbackErr);
            setError("Failed to load tasks. Please refresh the page.");
            setLoading(false);
          }
        } else if (err.code === "permission-denied") {
          setError("Permission denied. Please verify your email.");
          setLoading(false);
        } else {
          setError("Failed to load tasks. Please refresh the page.");
          setLoading(false);
        }
      }
    );

    unsubscribeRef.current = unsub;

    return () => {
      if (unsub) unsub();
    };
  }, [sessionDate, user, onTasksChange, dateRange]);

  // Optimistic CRUD operations
  async function handleAddOrEdit(task) {
    if (!user?.emailVerified) {
      setError("Email verification required to manage tasks.");
      return;
    }

    try {
      if (editing) {
        setTasks((prev) =>
          prev.map((t) => (t.id === editing.id ? { ...t, ...task } : t))
        );

        await updateDoc(doc(db, "tasks", task.id), {
          ...task,
          uid: user.uid,
        });
        
        // Update cache
        if (allTasksCache.current) {
          allTasksCache.current = allTasksCache.current.map((t) =>
            t.id === task.id ? { ...t, ...task } : t
          );
        }
        
        setEditing(null);
      } else {
        const newTask = {
          ...task,
          status: task.status || "pending",
          uid: user.uid,
          createdAt: new Date().toISOString(),
        };

        const docRef = await addDoc(collection(db, "tasks"), newTask);
        
        // Optimistically add to UI
        const taskWithId = { ...newTask, id: docRef.id };
        setTasks((prev) => [...prev, taskWithId]);
        
        // Update cache
        if (allTasksCache.current) {
          allTasksCache.current.push(taskWithId);
        }
      }
      setError(null);
    } catch (err) {
      console.error("Error saving task:", err);
      setError("Failed to save task. Please try again.");
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
      
      // Update cache
      if (allTasksCache.current) {
        allTasksCache.current = allTasksCache.current.filter(
          (t) => t.id !== task.id
        );
      }
      
      setError(null);
    } catch (err) {
      console.error("Error deleting task:", err);
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
      
      // Update cache
      if (allTasksCache.current) {
        allTasksCache.current = allTasksCache.current.map((t) =>
          t.id === task.id ? { ...t, status } : t
        );
      }
      
      setError(null);
    } catch (err) {
      console.error("Error updating task:", err);
      setError("Failed to update task.");
    }
  }

  function handleMarkComplete(task) {
    if (!user?.emailVerified) {
      setError("Email verification required.");
      return;
    }
    setTaskToComplete(task);
    setShowGratitudeModal(true);
  }

  async function confirmComplete(gratitude) {
    if (!user?.emailVerified) {
      setError("Email verification required.");
      setShowGratitudeModal(false);
      setTaskToComplete(null);
      return;
    }

    if (taskToComplete) {
      try {
        setTasks((prev) =>
          prev.map((t) =>
            t.id === taskToComplete.id
              ? { ...t, status: "completed", gratitude }
              : t
          )
        );

        await updateDoc(doc(db, "tasks", taskToComplete.id), {
          status: "completed",
          gratitude,
          completedAt: new Date().toISOString(),
        });
        
        // Update cache
        if (allTasksCache.current) {
          allTasksCache.current = allTasksCache.current.map((t) =>
            t.id === taskToComplete.id
              ? { ...t, status: "completed", gratitude }
              : t
          );
        }
        
        setError(null);
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

  const todayStr = new Date().toISOString().slice(0, 10);
  const isToday = sessionDate === todayStr;

  if (loading) {
    return (
      <div
        style={{
          background: "#fff",
          borderRadius: 16,
          padding: "40px 20px",
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
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: 10,
            padding: "8px 16px",
            background: "#667eea",
            color: "#fff",
            border: "none",
            borderRadius: 8,
            cursor: "pointer",
            fontWeight: 600,
          }}
        >
          Refresh Page
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 16,
        minHeight: 210,
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        padding: "20px 16px 24px 16px",
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
