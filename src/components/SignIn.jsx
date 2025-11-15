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
  const [showPassword, setShowPassword] = useState(false);

  const handleGoogleSignIn = async () => {
    setErr("");
    try {
      const provider = new GoogleAuthProvider();
      await signInWithPopup(auth, provider);
    } catch (e) {
      setErr(e.message);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      if (!/^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i.test(email)) {
        setErr("Please enter a valid email address.");
        return;
      }
      if (isSignUp) {
        const userCred = await createUserWithEmailAndPassword(auth, email, pw);
        await sendEmailVerification(userCred.user);
        await auth.signOut();
        setPendingVerification(true);
      } else {
        await signInWithEmailAndPassword(auth, email, pw);
      }
    } catch (e) {
      if (e.code === "auth/user-not-found") {
        setErr("No account found with this email.");
      } else if (e.code === "auth/wrong-password") {
        setErr("Incorrect password.");
      } else if (e.code === "auth/invalid-credential") {
        setErr("Invalid email or password.");
      } else if (e.code === "auth/weak-password") {
        setErr("Password should be at least 6 characters.");
      } else if (e.code === "auth/email-already-in-use") {
        setErr("Email already in use. Try signing in instead.");
      } else {
        setErr(e.message);
      }
    }
  };

  if (pendingVerification) {
    return (
      <div
        style={{
          minHeight: "100vh",
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 20,
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 20,
            boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
            maxWidth: 420,
            width: "100%",
            padding: 40,
            textAlign: "center",
          }}
        >
          <div
            style={{
              width: 80,
              height: 80,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2.5em",
              margin: "0 auto 20px",
            }}
          >
            📬
          </div>
          <h2
            style={{
              margin: "0 0 15px 0",
              fontSize: "1.8em",
              fontWeight: 700,
              color: "#2d3748",
            }}
          >
            Check Your Inbox
          </h2>
          <p
            style={{
              color: "#718096",
              fontSize: "1.05em",
              lineHeight: 1.7,
              marginBottom: 25,
            }}
          >
            We've sent a verification email to{" "}
            <strong style={{ color: "#667eea" }}>{email}</strong>
            <br />
            <br />
            Please verify your email and then sign in to access your account.
          </p>
          <button
            onClick={() => {
              setPendingVerification(false);
              setEmail("");
              setPw("");
            }}
            style={{
              width: "100%",
              padding: "14px 0",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#fff",
              borderRadius: 12,
              border: "none",
              fontWeight: 600,
              fontSize: "1.05em",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 6px 20px rgba(102, 126, 234, 0.5)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 4px 15px rgba(102, 126, 234, 0.4)";
            }}
          >
            Back to Sign In
          </button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 20,
      }}
    >
      <div
        style={{
          background: "#fff",
          borderRadius: 20,
          boxShadow: "0 20px 60px rgba(0,0,0,0.3)",
          maxWidth: 420,
          width: "100%",
          padding: 40,
        }}
      >
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: 30 }}>
          <div
            style={{
              width: 70,
              height: 70,
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "2em",
              margin: "0 auto 15px",
              boxShadow: "0 8px 20px rgba(102, 126, 234, 0.3)",
            }}
          >
            🗓️
          </div>
          <h2
            style={{
              margin: "0 0 8px 0",
              fontSize: "1.9em",
              fontWeight: 700,
              color: "#2d3748",
            }}
          >
            {isSignUp ? "Create Account" : "Welcome Back"}
          </h2>
          <p style={{ margin: 0, color: "#718096", fontSize: "0.95em" }}>
            {isSignUp
              ? "Sign up to start managing your events"
              : "Sign in to continue to Event Manager"}
          </p>
        </div>

        {/* Google Sign In */}
        <button
          onClick={handleGoogleSignIn}
          style={{
            width: "100%",
            padding: "14px 0",
            background: "#fff",
            color: "#2d3748",
            border: "2px solid #e2e8f0",
            borderRadius: 12,
            fontWeight: 600,
            fontSize: "1em",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 20,
            cursor: "pointer",
            gap: 10,
            transition: "all 0.2s",
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.borderColor = "#4285F4";
            e.currentTarget.style.boxShadow = "0 4px 12px rgba(66, 133, 244, 0.2)";
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.borderColor = "#e2e8f0";
            e.currentTarget.style.boxShadow = "none";
          }}
        >
          <svg width="20" height="20" viewBox="0 0 22 22">
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
          <span>Continue with Google</span>
        </button>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 15,
            marginBottom: 20,
          }}
        >
          <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
          <span style={{ color: "#a0aec0", fontSize: "0.9em", fontWeight: 500 }}>
            OR
          </span>
          <div style={{ flex: 1, height: 1, background: "#e2e8f0" }} />
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                color: "#4a5568",
                fontSize: "0.9em",
                fontWeight: 600,
              }}
            >
              Email Address
            </label>
            <input
              type="email"
              value={email}
              placeholder="you@example.com"
              required
              style={{
                width: "100%",
                padding: "12px 16px",
                border: "2px solid #e2e8f0",
                borderRadius: 10,
                fontSize: "1em",
                transition: "all 0.2s",
                outline: "none",
              }}
              onChange={(e) => setEmail(e.target.value)}
              onFocus={(e) => {
                e.currentTarget.style.borderColor = "#667eea";
                e.currentTarget.style.boxShadow =
                  "0 0 0 3px rgba(102, 126, 234, 0.1)";
              }}
              onBlur={(e) => {
                e.currentTarget.style.borderColor = "#e2e8f0";
                e.currentTarget.style.boxShadow = "none";
              }}
            />
          </div>

          <div style={{ marginBottom: 20 }}>
            <label
              style={{
                display: "block",
                marginBottom: 8,
                color: "#4a5568",
                fontSize: "0.9em",
                fontWeight: 600,
              }}
            >
              Password
            </label>
            <div style={{ position: "relative" }}>
              <input
                type={showPassword ? "text" : "password"}
                value={pw}
                placeholder="••••••••"
                required
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  paddingRight: 45,
                  border: "2px solid #e2e8f0",
                  borderRadius: 10,
                  fontSize: "1em",
                  transition: "all 0.2s",
                  outline: "none",
                }}
                onChange={(e) => setPw(e.target.value)}
                onFocus={(e) => {
                  e.currentTarget.style.borderColor = "#667eea";
                  e.currentTarget.style.boxShadow =
                    "0 0 0 3px rgba(102, 126, 234, 0.1)";
                }}
                onBlur={(e) => {
                  e.currentTarget.style.borderColor = "#e2e8f0";
                  e.currentTarget.style.boxShadow = "none";
                }}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                style={{
                  position: "absolute",
                  right: 12,
                  top: "50%",
                  transform: "translateY(-50%)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  fontSize: "1.2em",
                  padding: 5,
                }}
                title={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>

          <button
            type="submit"
            style={{
              width: "100%",
              padding: "14px 0",
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "#fff",
              borderRadius: 12,
              border: "none",
              fontWeight: 600,
              fontSize: "1.05em",
              cursor: "pointer",
              transition: "transform 0.2s, box-shadow 0.2s",
              boxShadow: "0 4px 15px rgba(102, 126, 234, 0.4)",
              marginBottom: 16,
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-2px)";
              e.currentTarget.style.boxShadow =
                "0 6px 20px rgba(102, 126, 234, 0.5)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow =
                "0 4px 15px rgba(102, 126, 234, 0.4)";
            }}
          >
            {isSignUp ? "Create Account" : "Sign In"}
          </button>
        </form>

        {/* Toggle Sign Up/In */}
        <div style={{ textAlign: "center", marginTop: 20 }}>
          <span style={{ color: "#718096", fontSize: "0.95em" }}>
            {isSignUp ? "Already have an account?" : "Don't have an account?"}
          </span>{" "}
          <button
            style={{
              color: "#667eea",
              background: "none",
              border: "none",
              fontWeight: 700,
              cursor: "pointer",
              fontSize: "0.95em",
              textDecoration: "underline",
            }}
            type="button"
            onClick={() => {
              setIsSignUp((v) => !v);
              setErr("");
            }}
          >
            {isSignUp ? "Sign In" : "Sign Up"}
          </button>
        </div>

        {/* Error Message */}
        {err && (
          <div
            style={{
              marginTop: 20,
              padding: "12px 16px",
              background: "#fff5f5",
              border: "1px solid #fc8181",
              borderRadius: 10,
              color: "#c53030",
              fontSize: "0.95em",
              display: "flex",
              alignItems: "center",
              gap: 10,
            }}
          >
            <span style={{ fontSize: "1.2em" }}>⚠️</span>
            <span>{err}</span>
          </div>
        )}
      </div>
    </div>
  );
}
