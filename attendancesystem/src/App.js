import React, { useState, useEffect } from "react";
import Register from "./Register";
import Attendance from "./Attendance";
import { auth } from "./firebaseConfig";
import {
  onAuthStateChanged,
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";

function App() {
  const [activePage, setActivePage] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await signInWithPopup(auth, provider);
    } catch (error) {
      console.error(error);
      alert("❌ فشل تسجيل الدخول عبر Google");
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <div
      style={{
        textAlign: "center",
        fontFamily: "Arial, sans-serif",
        marginTop: "30px",
      }}
    >
      <h1 style={{ color: "#2c3e50" }}>📌 نظام تسجيل الحضور بالوجه</h1>

      {!user ? (
        <>
          <p style={{ fontSize: "18px", color: "#7f8c8d" }}>
            الرجاء تسجيل الدخول عبر Google
          </p>
          <button
            onClick={loginWithGoogle}
            style={{
              backgroundColor: "#e74c3c",
              color: "white",
              padding: "10px 20px",
              margin: "10px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            🔑 تسجيل دخول
          </button>
        </>
      ) : (
        <>
          <p style={{ fontSize: "18px", color: "#27ae60" }}>
            مرحباً {user.email}
          </p>
          <button
            onClick={logout}
            style={{
              backgroundColor: "#c0392b",
              color: "white",
              padding: "10px 20px",
              margin: "10px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            🚪 تسجيل خروج
          </button>

          {user.email === "abozedayham@gmail.com" && (
            <button
              onClick={() => setActivePage("register")}
              style={{
                backgroundColor: "#2980b9",
                color: "white",
                padding: "10px 20px",
                margin: "10px",
                border: "none",
                borderRadius: "5px",
                cursor: "pointer",
                fontSize: "16px",
              }}
            >
              📝 تسجيل جديد
            </button>
          )}

          <button
            onClick={() => setActivePage("attendance")}
            style={{
              backgroundColor: "#27ae60",
              color: "white",
              padding: "10px 20px",
              margin: "10px",
              border: "none",
              borderRadius: "5px",
              cursor: "pointer",
              fontSize: "16px",
            }}
          >
            ✅ تسجيل حضور
          </button>

          <div style={{ marginTop: "30px" }}>
            {activePage === "register" &&
              user.email === "abozedayham@gmail.com" && <Register />}
            {activePage === "attendance" && <Attendance />}
          </div>
        </>
      )}
    </div>
  );
}

export default App;
