// src/App.jsx
import React, { useState, useEffect } from "react";
import AuthProvider, { useAuth } from "./components/AuthProvider";
import SignIn from "./components/SignIn";
import UserHeader from "./components/UserHeader";
import SessionSelector from "./components/SessionSelector";
import SessionTasks from "./components/SessionTasks";
import ScoreBar from "./components/ScoreBar";
import { db } from "./firebase";
import { collection, query, where, getDocs, orderBy } from "firebase/firestore";

// ---------- IST Helper ----------
function nowIST() {
  return new Date(
    new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })
  );
}

// ---------- AppInner (NOT DEFAULT EXPORT) ----------
function AppInner() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = nowIST();
    return d.toISOString().slice(0, 10);
  });

  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  // listen for date switching
  useEffect(() => {
    const handleDateSwitch = (e) => {
      setSelectedDate(e.detail);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("switchDate", handleDateSwitch);
    return () => window.removeEventListener("switchDate", handleDateSwitch);
  }, []);

  // score + streak
  const calculateScoreAndStreak = async () => {
    if (!user) return;
    try {
      const q = query(
        collection(db, "tasks"),
        where("uid", "==", user.uid),
        where("status", "==", "completed"),
        orderBy("due", "desc")
      );

      const snapshot = await getDocs(q);
      const completedTasks = snapshot.docs.map((doc) => ({
        ...doc.data(),
        id: doc.id,
      }));

      // score
      setScore(completedTasks.length);

      // group by day
      const tasksByDay = {};
      completedTasks.forEach((task) => {
        if (!task.due) return;
        const dateStr = task.due.slice(0, 10);
        tasksByDay[dateStr] = true;
      });

      // streak (IST)
      let streakCount = 0;
      let dayPointer = nowIST();
      dayPointer.setHours(0, 0, 0, 0);

      while (true) {
        const dateStr = dayPointer.toISOString().slice(0, 10);
        if (tasksByDay[dateStr]) {
          streakCount++;
          dayPointer.setDate(dayPointer.getDate() - 1);
        } else {
          break;
        }
      }

      setStreak(streakCount);
    } catch (err) {
      console.error("Error calculating score/streak:", err);
    }
  };

  useEffect(() => {
    if (!user) return;

    calculateScoreAndStreak();

    const listener = () => calculateScoreAndStreak();
    window.addEventListener("tasksChanged", listener);

    return () => window.removeEventListener("tasksChanged", listener);
  }, [user]);

  if (!user) return <SignIn />;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px 15px",
      }}
    >
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 24, color: "#fff" }}>
          <h1
            style={{
              fontSize: "clamp(1.8em, 5vw, 2.5em)",
              margin: "0 0 8px 0",
              fontWeight: 700,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: "1.2em" }}>🗓️</span> Event Manager
          </h1>
          <p style={{ margin: 0, opacity: 0.95 }}>
            Stay organized • build habits • celebrate wins
          </p>
        </div>

        <UserHeader />
        <ScoreBar score={score} streak={streak} />

        <SessionSelector
          selectedDate={selectedDate}
          onSelectDate={setSelectedDate}
        />

        <SessionTasks
          sessionDate={selectedDate}
          onTasksChange={() =>
            window.dispatchEvent(new CustomEvent("tasksChanged"))
          }
        />
      </div>
    </div>
  );
}

// ---------- DEFAULT EXPORT  ----------
export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
