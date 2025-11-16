// src/constants.js
export const TASK_STATUSES = ["pending", "ongoing", "completed"];

export const TASK_PRIORITIES = {
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  URGENT: "urgent"
};

export const PRIORITY_COLORS = {
  low: "#10b981",      // Green
  medium: "#3b82f6",   // Blue
  high: "#f59e0b",     // Orange
  urgent: "#ef4444"    // Red
};

export const PRIORITY_LABELS = {
  low: "Low",
  medium: "Medium",
  high: "High",
  urgent: "Urgent"
};

export const REMINDER_SETTINGS = {
  "1hour": { label: "1 hour before", minutes: 60 },
  "3hours": { label: "3 hours before", minutes: 180 },
  "1day": { label: "1 day before", minutes: 1440 },
  "3days": { label: "3 days before", minutes: 4320 },
  "1week": { label: "1 week before", minutes: 10080 }
};
