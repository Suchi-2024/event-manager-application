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

function AppInner() {
  const { user } = useAuth();
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().slice(0, 10));
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  useEffect(() => {
    const handleDateSwitch = (e) => {
      setSelectedDate(e.detail);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };
    window.addEventListener("switchDate", handleDateSwitch);
    return () => window.removeEventListener("switchDate", handleDateSwitch);
  }, []);

  // calculate score & streak (same logic but wrapped)
  const calculateScoreAndStreak = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, "tasks"), where("uid", "==", user.uid), where("status", "==", "completed"), orderBy("due", "desc"));
      const snapshot = await getDocs(q);
      const completedTasks = snapshot.docs.map((doc) => ({ ...doc.data(), id: doc.id }));
      setScore(completedTasks.length);

      const tasksByDate = {};
      completedTasks.forEach((task) => {
        const taskDate = task.due?.slice(0, 10);
        if (!tasksByDate[taskDate]) tasksByDate[taskDate] = [];
        tasksByDate[taskDate].push(task);
      });

      let currentStreak = 0;
      let checkDate = new Date();
      checkDate.setHours(0, 0, 0, 0);

      while (true) {
        const dateStr = checkDate.toISOString().slice(0, 10);
        if (tasksByDate[dateStr] && tasksByDate[dateStr].length > 0) {
          currentStreak++;
          checkDate.setDate(checkDate.getDate() - 1);
        } else {
          // if today had none, skip it and check previous day (keeps streak logic consistent)
          if (dateStr === new Date().toISOString().slice(0, 10)) {
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

  // recalc when tasks changed
  useEffect(() => {
    const recalc = () => {
      calculateScoreAndStreak();
    };
    window.addEventListener("tasksChanged", recalc);
    return () => window.removeEventListener("tasksChanged", recalc);
  }, [user]);

  if (!user) return <SignIn />;

  return (
    <div style={{ minHeight: "100vh", background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)", padding: "20px 15px" }}>
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: 24, color: "#fff" }}>
          <h1 style={{ fontSize: "clamp(1.8em, 5vw, 2.5em)", margin: "0 0 8px 0", fontWeight: 700, textShadow: "0 2px 10px rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, flexWrap: "wrap" }}>
            <span style={{ fontSize: "1.2em" }}>🗓️</span>
            Event Manager
          </h1>
          <p style={{ margin: 0, opacity: 0.9, fontSize: "clamp(0.95em, 3vw, 1.1em)", fontWeight: 300 }}>Stay organized, track progress, build habits</p>
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
