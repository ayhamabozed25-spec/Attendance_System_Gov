import React, { useRef, useState } from "react";
import * as faceapi from "face-api.js";
import { db } from "./firebaseConfig";
import { collection, addDoc } from "firebase/firestore";

function Register() {
  const videoRef = useRef();
  const [name, setName] = useState("");

  const startCamera = async () => {
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      videoRef.current.srcObject = stream;
    });
  };

  const captureFace = async () => {
    const detections = await faceapi.detectSingleFace(videoRef.current).withFaceLandmarks().withFaceDescriptor();
    if (detections) {
      await addDoc(collection(db, "users"), {
        name,
        descriptor: Array.from(detections.descriptor)
      });
      alert("تم تسجيل المستخدم بنجاح!");
    }
  };

  return (
    <div>
      <input type="text" placeholder="أدخل اسمك" onChange={e => setName(e.target.value)} />
      <video ref={videoRef} autoPlay width="400" height="300"></video>
      <button onClick={startCamera}>تشغيل الكاميرا</button>
      <button onClick={captureFace}>تسجيل</button>
    </div>
  );
}

export default Register;
