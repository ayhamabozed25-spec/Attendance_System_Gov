
import React, { useState } from "react";
import Register from "./Register";
import Attendance from "./Attendance";

function App() {
  const [activePage, setActivePage] = useState(null);

  return (
    <div>
      <h1>نظام تسجيل الحضور بالوجه</h1>

      {/* الأزرار */}
      <button onClick={() => setActivePage("register")}>تسجيل جديد</button>
      <button onClick={() => setActivePage("attendance")}>تسجيل حضور</button>

      {/* عرض المكونات حسب الزر المضغوط */}
      {activePage === "register" && <Register />}
      {activePage === "attendance" && <Attendance />}
    </div>
  );
}

export default App;
