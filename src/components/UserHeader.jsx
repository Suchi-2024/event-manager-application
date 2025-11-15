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
        borderRadius: 16,
        padding: "20px 24px",
        marginBottom: 20,
        boxShadow: "0 4px 20px rgba(0,0,0,0.08)",
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        border: "1px solid rgba(102, 126, 234, 0.1)",
      }}
    >
      <div style={{ flex: 1 }}>
        <div
          style={{
            fontSize: "1.2em",
            fontWeight: 700,
            color: "#2d3748",
            marginBottom: 4,
          }}
        >
          👋 Welcome back, {user?.displayName || user?.email?.split("@")[0]}!
        </div>
        <div style={{ fontSize: "0.9em", color: "#718096" }}>
          {user?.email}
        </div>
      </div>
      <button
        onClick={handleLogout}
        style={{
          padding: "10px 20px",
          background: "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
          color: "#fff",
          border: "none",
          borderRadius: 10,
          fontWeight: 600,
          cursor: "pointer",
          fontSize: "0.95em",
          transition: "transform 0.2s, box-shadow 0.2s",
          boxShadow: "0 4px 12px rgba(245, 87, 108, 0.3)",
        }}
        onMouseOver={(e) => {
          e.currentTarget.style.transform = "translateY(-2px)";
          e.currentTarget.style.boxShadow =
            "0 6px 16px rgba(245, 87, 108, 0.4)";
        }}
        onMouseOut={(e) => {
          e.currentTarget.style.transform = "translateY(0)";
          e.currentTarget.style.boxShadow =
            "0 4px 12px rgba(245, 87, 108, 0.3)";
        }}
      >
        🚪 Logout
      </button>
    </div>
  );
}
