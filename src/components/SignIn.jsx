import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  GoogleAuthProvider,
  signInWithPopup,
} from "firebase/auth";
import { auth } from "../firebase";

export default function SignIn() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [pw, setPw] = useState("");
  const [err, setErr] = useState("");
  const [pendingVerification, setPendingVerification] = useState(false);

  // UI/UX style
  const cardStyle = {
    background: "#fff",
    borderRadius: 12,
    boxShadow: "0 2px 10px #ececff",
    maxWidth: 360,
    margin: "3em auto",
    padding: 35,
  };

  const handleGoogleSignIn = async () => {
    setErr("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
      // Google accounts are typically pre-verified
      // AuthProvider will handle the verification check
    } catch (e) {
      setErr(e.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      // Validate simple email pattern before using Firebase
      if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
        setErr("Please enter a valid email address.");
        return;
      }
      if (isSignUp) {
        const userCred = await createUserWithEmailAndPassword(auth, email, pw);
        await sendEmailVerification(userCred.user);
        await auth.signOut(); // Sign out immediately after signup
        setPendingVerification(true);
      } else {
        // Try to sign in
        await signInWithEmailAndPassword(auth, email, pw);
        // AuthProvider will handle the verification check and show message if needed
      }
    } catch (e) {
      // Handle specific error for unverified email
      if (e.code === "auth/user-not-found") {
        setErr("No account found with this email.");
      } else if (e.code === "auth/wrong-password") {
        setErr("Incorrect password.");
      } else if (e.code === "auth/invalid-credential") {
        setErr("Invalid email or password.");
      } else {
        setErr(e.message);
      }
    }
  };

  if (pendingVerification) {
    return (
      <div style={cardStyle}>
        <div style={{ fontSize: "3em", textAlign: "center", marginBottom: 10 }}>
          📬
        </div>
        <h2 style={{ textAlign: "center", marginBottom: 15 }}>
          Check Your Inbox
        </h2>
        <div style={{ color: "#555", fontSize: "1.02em", lineHeight: 1.6 }}>
          A verification email has been sent to <b>{email}</b>.<br />
          <br />
          Please verify your email and then sign in to access your account.
        </div>
        <button
          onClick={() => {
            setPendingVerification(false);
            setEmail("");
            setPw("");
          }}
          style={{
            width: "100%",
            padding: "10px 0",
            background: "#5338ff",
            color: "#fff",
            borderRadius: 6,
            border: "none",
            fontWeight: 600,
            fontSize: "1em",
            marginTop: 20,
            cursor: "pointer",
          }}
        >
          Back to Sign In
        </button>
      </div>
    );
  }

  return (
    <div style={cardStyle}>
      <h2 style={{ marginBottom: 7, textAlign: "center" }}>
        {isSignUp ? "Sign Up" : "Sign In"}
      </h2>
      <form onSubmit={handleSubmit} style={{ marginBottom: 15 }}>
        <input
          type="email"
          value={email}
          placeholder="Email"
          required
          style={{
            width: "100%",
            padding: "10px 12px",
            marginBottom: 12,
            border: "1px solid #bbb",
            borderRadius: 6,
            fontSize: "1em",
          }}
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          value={pw}
          placeholder="Password"
          required
          style={{
            width: "100%",
            padding: "10px 12px",
            marginBottom: 12,
            border: "1px solid #bbb",
            borderRadius: 6,
            fontSize: "1em",
          }}
          onChange={(e) => setPw(e.target.value)}
        />
        <button
          style={{
            width: "100%",
            padding: "10px 0",
            background: "#5338ff",
            color: "#fff",
            borderRadius: 6,
            border: "none",
            fontWeight: 600,
            fontSize: "1em",
            marginBottom: 8,
            cursor: "pointer",
            letterSpacing: 1,
          }}
        >
          {isSignUp ? "Sign Up" : "Sign In"}
        </button>
      </form>
      <button
        onClick={handleGoogleSignIn}
        style={{
          width: "100%",
          padding: "10px 0",
          background: "#fff",
          color: "#222",
          border: "1.5px solid #4285F4",
          borderRadius: 6,
          fontWeight: 600,
          fontSize: "1em",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 6,
          cursor: "pointer",
          gap: 8,
        }}
      >
        <svg
          width="22"
          height="22"
          viewBox="0 0 22 22"
          style={{ verticalAlign: "middle" }}
        >
          <g>
            <path
              d="M21.52 11.24c0-.79-.07-1.39-.23-1.99H11v3.61h5.91c-.12.97-.77 2.41-2.22 3.37l-.02.15 3.24 2.52.22.02c2.04-1.94 3.21-4.81 3.21-8.68z"
              fill="#4285F4"
            ></path>
            <path
              d="M11 22c2.97 0 5.46-.98 7.28-2.66l-3.47-2.7c-.94.68-2.18 1.15-3.81 1.15-2.93 0-5.41-1.97-6.3-4.64H1.06v2.84C2.87 19.46 6.61 22 11 22z"
              fill="#34A853"
            ></path>
            <path
              d="M4.7 13.15A6.919 6.919 0 013.6 11c0-.74.13-1.46.28-2.15V6.01H1.06A11.009 11.009 0 000 11c0 1.73.43 3.36 1.06 4.99L4.7 13.15z"
              fill="#FBBC05"
            ></path>
            <path
              d="M11 4.36c1.63 0 2.74.7 3.36 1.28l2.45-2.42C16.44 1.17 13.97 0 11 0 6.61 0 2.87 2.54 1.06 6.01l3.53 2.84c.88-2.67 3.36-4.49 6.41-4.49z"
              fill="#EA4335"
            ></path>
          </g>
        </svg>
        <span style={{ color: "#4285F4" }}>Sign in with Google</span>
      </button>
      <div style={{ marginTop: 7, fontSize: "0.98em", textAlign: "center" }}>
        <button
          style={{
            color: "#5338ff",
            background: "none",
            border: "none",
            textDecoration: "underline",
            cursor: "pointer",
            fontWeight: "bold",
          }}
          type="button"
          onClick={() => setIsSignUp((v) => !v)}
        >
          {isSignUp
            ? "Already have an account? Sign In"
            : "No account? Sign Up"}
        </button>
      </div>
      {err && (
        <div style={{ color: "red", marginTop: 9, fontWeight: 500 }}>{err}</div>
      )}
    </div>
  );
}
