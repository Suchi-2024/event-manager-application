import React from "react";
import { auth } from "../firebase";
import { signOut } from "firebase/auth";
import { useAuth } from "./AuthProvider";

export default function UserHeader() {
  const { user } = useAuth();

  const handleLogout = async () => {
    try {
      await signOut(auth);
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  return (
    <div
      style={{
        background: "#fff",
        borderRadius: 12,
        padding: "15px 20px",
        marginBottom: 20,
        boxShadow: "0 2px 10px #ececff",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
      }}
    >
      <div>
        <div style={{ fontSize: "1.1em", fontWeight: 600, color: "#333" }}>
          👋 Welcome, {user?.displayName || user?.email?.split("@")[0]}
        </div>
        <div style={{ fontSize: "0.9em", color: "#888", marginTop: 2 }}>
          {user?.email}
        </div>
      </div>
      <button
        onClick={handleLogout}
        style={{
          padding: "8px 16px",
          background: "#ff4444",
          color: "#fff",
          border: "none",
          borderRadius: 6,
          fontWeight: 600,
          cursor: "pointer",
          fontSize: "0.95em",
        }}
      >
        🚪 Logout
      </button>
    </div>
  );
}
