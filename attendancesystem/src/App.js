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
      alert("فشل تسجيل الدخول عبر Google");
    }
  };

  const logout = async () => {
    await signOut(auth);
  };

  return (
    <div>
      <h1>نظام تسجيل الحضور بالوجه</h1>

      {!user ? (
        <>
          <p>الرجاء تسجيل الدخول عبر Google</p>
          <button onClick={loginWithGoogle}>تسجيل دخول</button>
        </>
      ) : (
        <>
          <p>مرحباً {user.email}</p>
          <button onClick={logout}>تسجيل خروج</button>

          {user.email === "abozedayham@gmail.com" && (
            <button onClick={() => setActivePage("register")}>تسجيل جديد</button>
          )}

         
          <button onClick={() => setActivePage("attendance")}>تسجيل حضور</button>

        
          {activePage === "register" &&
            user.email === "abozedayham@gmail.com" && <Register />}
          {activePage === "attendance" && <Attendance />}
        </>
      )}
    </div>
  );
}

export default App;
