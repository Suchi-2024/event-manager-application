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
        // Get all completed tasks for the user
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

        // Calculate total score (1 point per completed task)
        setScore(completedTasks.length);

        // Calculate streak
        let currentStreak = 0;
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // Group tasks by date
        const tasksByDate = {};
        completedTasks.forEach((task) => {
          const taskDate = task.due.slice(0, 10); // Get YYYY-MM-DD
          if (!tasksByDate[taskDate]) {
            tasksByDate[taskDate] = [];
          }
          tasksByDate[taskDate].push(task);
        });

        // Check consecutive days backwards from today
        let checkDate = new Date(today);
        while (true) {
          const dateStr = checkDate.toISOString().slice(0, 10);
          if (tasksByDate[dateStr] && tasksByDate[dateStr].length > 0) {
            currentStreak++;
            checkDate.setDate(checkDate.getDate() - 1);
          } else {
            // If today has no tasks, don't break the streak yet
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

    // Recalculate every minute to keep it updated
    const interval = setInterval(calculateScoreAndStreak, 60000);
    return () => clearInterval(interval);
  }, [user]);

  // Recalculate when tasks change
  const handleTasksChange = () => {
    if (user) {
      // Trigger recalculation
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
    <div style={{ maxWidth: 640, margin: "0 auto", padding: 20 }}>
      <h1 style={{ marginBottom: 20, textAlign: "center" }}>
        🗓️ Event Manager
      </h1>
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
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppInner />
    </AuthProvider>
  );
}
