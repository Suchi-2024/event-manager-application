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
import { TASK_STATUSES } from "../constants";

export default function SessionTasks({ sessionDate, onTasksChange }) {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showGratitudeModal, setShowGratitudeModal] = useState(false);
  const [taskToComplete, setTaskToComplete] = useState(null);

  // Load tasks for ONLY the selected date & user
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const startOfDay = sessionDate + "T00:00";
    const endOfDay = sessionDate + "T23:59";
    const q = query(
      collection(db, "tasks"),
      where("uid", "==", user.uid),
      where("due", ">=", startOfDay),
      where("due", "<=", endOfDay),
      orderBy("due", "asc")
    );
    const unsub = onSnapshot(q, (snap) => {
      const t = snap.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setTasks(t);
      setLoading(false);
      if (onTasksChange) onTasksChange(t);
    });
    return unsub;
  }, [sessionDate, user, onTasksChange]);

  // CRUD Actions
  async function handleAddOrEdit(task) {
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
      });
    }
  }

  async function handleDelete(task) {
    await deleteDoc(doc(db, "tasks", task.id));
  }

  async function markTaskStatus(task, status) {
    await updateDoc(doc(db, "tasks", task.id), { status });
  }

  // Show modal when marking complete
  function handleMarkComplete(task) {
    setTaskToComplete(task);
    setShowGratitudeModal(true);
  }

  // Confirm completion with gratitude
  async function confirmComplete(gratitude) {
    if (taskToComplete) {
      await updateDoc(doc(db, "tasks", taskToComplete.id), {
        status: "completed",
        gratitude: gratitude,
      });
    }
    setShowGratitudeModal(false);
    setTaskToComplete(null);
  }

  // Cancel completion
  function cancelComplete() {
    setShowGratitudeModal(false);
    setTaskToComplete(null);
  }

  const todayStr = new Date().toISOString().slice(0, 10);

  if (loading) return <div style={{ marginTop: 20 }}>Loading session...</div>;
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
  >>
      <h3
        style={{
          margin: 0,
          marginBottom: 8,
          fontWeight: 500,
          fontSize: "1.2em",
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
            color: "#626282",
            marginTop: 16,
            textAlign: "center",
          }}
        >
          No task is assigned for the day
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

