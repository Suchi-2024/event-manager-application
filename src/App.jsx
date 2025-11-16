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

// IST helpers
function nowIST() {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" }));
}

export default function AppInner() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(() => {
    // default to IST date string yyyy-mm-dd
    const d = nowIST();
    return d.toISOString().slice(0, 10);
  });
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  // handle external switchDate events
  useEffect(() => {
    const handleDateSwitch = (e) => {
      setSelectedDate(e.detail);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("switchDate", handleDateSwitch);
    return () => window.removeEventListener("switchDate", handleDateSwitch);
  }, []);

  // calculate score & streak using IST and dueDate field
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
      const completedTasks = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setScore(completedTasks.length);

      // group by dueDate (YYYY-MM-DD)
      const tasksByDate = {};
      completedTasks.forEach((task) => {
        const d = task.due?.slice(0, 10);
        if (!d) return;
        if (!tasksByDate[d]) tasksByDate[d] = 0;
        tasksByDate[d] += 1;
      });

      // streak logic using IST day boundaries
      let currentStreak = 0;
      let checkDate = nowIST();
      checkDate.setHours(0, 0, 0, 0);

      while (true) {
        const dateStr = checkDate.toISOString().slice(0, 10);
        if (tasksByDate[dateStr] && tasksByDate[dateStr] > 0) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          // if today's date had none, still continue checking previous day? follow original behavior:
          if (dateStr === nowIST().toISOString().slice(0, 10)) {
            checkDate.setDate(checkDate.getDate() - 1);
            continue;
          }
          break;
        }
      }
      setStreak(currentStreak);
    } catch (err) {
      console.error("Error calculating score and streak:", err);
    }
  };

  useEffect(() => {
    calculateScoreAndStreak();
    const interval = setInterval(calculateScoreAndStreak, 300000);
    return () => clearInterval(interval);
  }, [user]);

  // Recalculate on events emitted by SessionTasks
  useEffect(() => {
    const recalc = () => calculateScoreAndStreak();
    window.addEventListener("tasksChanged", recalc);
    return () => window.removeEventListener("tasksChanged", recalc);
  }, [user]);

  if (!user) return <SignIn />;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: "20px 15px" }}>
      <div style={{ maxWidth: 900, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 24, color: "#fff" }}>
          <h1 style={{ fontSize: "clamp(1.8em, 5vw, 2.5em)", margin: "0 0 8px 0", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: 10 }}>
            <span style={{ fontSize: "1.2em" }}>🗓️</span> Event Manager
          </h1>
          <p style={{ margin: 0, opacity: 0.95 }}>Stay organized • build habits • celebrate wins</p>
        </div>

        <UserHeader />
        <ScoreBar score={score} streak={streak} />
        <SessionSelector selectedDate={selectedDate} onSelectDate={setSelectedDate} />
        <SessionTasks sessionDate={selectedDate} onTasksChange={() => window.dispatchEvent(new CustomEvent("tasksChanged"))} />
      </div>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
