import React from "react";
import TaskItem from "./TaskItem";

export default function TaskList({
  tasks,
  onEdit,
  onDelete,
  onMarkOngoing,
  onMarkComplete,
  readOnly = false, // default: editable
}) {
  if (!tasks.length) return <div>No tasks yet. 🎉</div>;
  return (
    <ul style={{ padding: 0, listStyle: "none" }}>
      {tasks.map((task) => (
        <TaskItem
          key={task.id}
          task={task}
          onEdit={onEdit}
          onDelete={onDelete}
          onMarkOngoing={onMarkOngoing}
          onMarkComplete={onMarkComplete}
          readOnly={readOnly}
        />
      ))}
    </ul>
  );
}

