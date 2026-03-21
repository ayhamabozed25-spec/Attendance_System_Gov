import React, { useState, useEffect } from "react";
import Register from "./Register";
import Attendance from "./Attendance";
import { auth } from "./firebaseConfig";
import { onAuthStateChanged, signInWithEmailAndPassword, signOut } from "firebase/auth";

function App() {
  const [activePage, setActivePage] = useState(null);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  const login = async () => {
    try {
      // هنا ضع البريد وكلمة المرور المسموح بها
      await signInWithEmailAndPassword(auth, "alloweduser@example.com", "password123");
    } catch (error) {
      console.error(error);
      alert("فشل تسجيل الدخول");
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
          <p>الرجاء تسجيل الدخول</p>
          <button onClick={login}>تسجيل دخول</button>
        </>
      ) : (
        <>
          <p>مرحباً {user.email}</p>
          <button onClick={logout}>تسجيل خروج</button>

          {/* إذا كان البريد هو المسموح له، يظهر له زر التسجيل */}
          {user.email === "alloweduser@example.com" && (
            <button onClick={() => setActivePage("register")}>تسجيل جديد</button>
          )}

          {/* زر الحضور يظهر للجميع */}
          <button onClick={() => setActivePage("attendance")}>تسجيل حضور</button>

          {/* عرض المكونات حسب الزر المضغوط */}
          {activePage === "register" && user.email === "alloweduser@example.com" && <Register />}
          {activePage === "attendance" && <Attendance />}
        </>
      )}
    </div>
  );
}

export default App;
