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
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);

  // Calculate score and streak
  useEffect(() => {
    if (!user) return;

    const calculateScoreAndStreak = async () => {
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

        setScore(completedTasks.length);

        let currentStreak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const tasksByDate = {};
        completedTasks.forEach((task) => {
          const taskDate = task.due.slice(0, 10);
          if (!tasksByDate[taskDate]) {
            tasksByDate[taskDate] = [];
          }
          tasksByDate[taskDate].push(task);
        });

        let checkDate = new Date(today);
        while (true) {
          const dateStr = checkDate.toISOString().slice(0, 10);
          if (tasksByDate[dateStr] && tasksByDate[dateStr].length > 0) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            if (dateStr === new Date().toISOString().slice(0, 10)) {
              checkDate.setDate(checkDate.getDate() - 1);
              continue;
            }
            break;
          }
        }

        setStreak(currentStreak);
      } catch (error) {
        console.error("Error calculating score and streak:", error);
      }
    };

    calculateScoreAndStreak();
    const interval = setInterval(calculateScoreAndStreak, 60000);
    return () => clearInterval(interval);
  }, [user]);

  const handleTasksChange = () => {
    if (user) {
      const event = new CustomEvent("tasksChanged");
      window.dispatchEvent(event);
    }
  };

  useEffect(() => {
    const recalculate = async () => {
      if (!user) return;

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

      setScore(completedTasks.length);

      const tasksByDate = {};
      completedTasks.forEach((task) => {
        const taskDate = task.due.slice(0, 10);
        if (!tasksByDate[taskDate]) {
          tasksByDate[taskDate] = [];
        }
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
          if (dateStr === new Date().toISOString().slice(0, 10)) {
            checkDate.setDate(checkDate.getDate() - 1);
            continue;
          }
          break;
        }
      }

      setStreak(currentStreak);
    };

    window.addEventListener("tasksChanged", recalculate);
    return () => window.removeEventListener("tasksChanged", recalculate);
  }, [user]);

  if (!user) return <SignIn />;

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        padding: "20px",
      }}
    >
      <div
        style={{
          maxWidth: 800,
          margin: "0 auto",
        }}
      >
        {/* Header */}
        <div
          style={{
            textAlign: "center",
            marginBottom: 30,
            color: "#fff",
          }}
        >
          <h1
            style={{
              fontSize: "2.5em",
              margin: "0 0 10px 0",
              fontWeight: 700,
              textShadow: "0 2px 10px rgba(0,0,0,0.2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 12,
            }}
          >
            <span style={{ fontSize: "1.2em" }}>🗓️</span>
            Event Manager
          </h1>
          <p
            style={{
              margin: 0,
              opacity: 0.9,
              fontSize: "1.1em",
              fontWeight: 300,
            }}
          >
            Stay organized, track progress, build habits
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
          onTasksChange={handleTasksChange}
        />
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
