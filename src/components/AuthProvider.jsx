import React, { createContext, useContext, useState, useEffect } from "react";
import { auth } from "../firebase";
import { onAuthStateChanged } from "firebase/auth";

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export default function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [needsVerification, setNeedsVerification] = useState(false);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // Check if email is verified
        if (firebaseUser.emailVerified) {
          setUser(firebaseUser);
          setNeedsVerification(false);
        } else {
          // Email not verified - block access
          setUser(null);
          setNeedsVerification(true);
        }
      } else {
        setUser(null);
        setNeedsVerification(false);
      }
      setLoading(false);
    });

    return unsubscribe;
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          height: "100vh",
          fontSize: "1.2em",
          color: "#666",
        }}
      >
        Loading...
      </div>
    );
  }

  if (needsVerification) {
    return (
      <div
        style={{
          maxWidth: 400,
          margin: "5em auto",
          padding: 35,
          background: "#fff",
          borderRadius: 12,
          boxShadow: "0 2px 10px #ececff",
          textAlign: "center",
        }}
      >
        <div style={{ fontSize: "3em", marginBottom: 15 }}>📧</div>
        <h2 style={{ marginBottom: 15, color: "#333" }}>
          Email Verification Required
        </h2>
        <p style={{ color: "#555", lineHeight: 1.6, marginBottom: 20 }}>
          Please verify your email address before accessing your account. Check
          your inbox for the verification link.
        </p>
        <p style={{ color: "#888", fontSize: "0.95em", marginBottom: 20 }}>
          After verifying, please refresh this page or sign in again.
        </p>
        <button
          onClick={() => {
            auth.signOut();
            setNeedsVerification(false);
          }}
          style={{
            padding: "10px 20px",
            background: "#5338ff",
            color: "#fff",
            border: "none",
            borderRadius: 6,
            fontWeight: 600,
            cursor: "pointer",
            fontSize: "1em",
          }}
        >
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user }}>{children}</AuthContext.Provider>
  );
}
