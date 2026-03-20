import React, { useRef, useState, useEffect } from "react";
import * as faceapi from "face-api.js";
import { db } from "./firebaseConfig";
import { collection, addDoc ,setDoc,doc } from "firebase/firestore";

function Register() {
  const videoRef = useRef();
  const [name, setName] = useState("");
  const [modelsLoaded, setModelsLoaded] = useState(false);

  // تحميل النماذج عند بداية التشغيل
  useEffect(() => {
    const loadModels = async () => {
      const MODEL_URL = process.env.PUBLIC_URL + "/models";
      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      setModelsLoaded(true);
      console.log("Models loaded successfully");
    };
    loadModels();
  }, []);

  const startCamera = async () => {
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      videoRef.current.srcObject = stream;
    });
  };

const captureFace = async () => {
  if (!modelsLoaded) {
    alert("النماذج لم تُحمّل بعد، انتظر قليلاً...");
    return;
  }

  const detections = await faceapi
    .detectAllFaces(videoRef.current)
    .withFaceLandmarks()
    .withFaceDescriptors();

  if (detections.length > 0) {
    // تجهيز canvas للرسم فوق الفيديو
    const canvas = faceapi.createCanvasFromMedia(videoRef.current);
    document.body.append(canvas); // أو ضع canvas داخل نفس الـ div
    const displaySize = {
      width: videoRef.current.width,
      height: videoRef.current.height,
    };
    faceapi.matchDimensions(canvas, displaySize);

    const resizedDetections = faceapi.resizeResults(detections, displaySize);
    faceapi.draw.drawDetections(canvas, resizedDetections);
    faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);

    // حفظ أول وجه
    await setDoc(doc(db, "users", name), {
      name,
      descriptor: Array.from(detections[0].descriptor),
    });
    alert("تم تسجيل المستخدم بنجاح!");
  } else {
    alert("لم يتم التعرف على وجه، حاول مرة أخرى.");
  }
};


  return (
    <div>
      <input
        type="text"
        placeholder="أدخل اسمك"
        onChange={e => setName(e.target.value)}
      />
      <video ref={videoRef} autoPlay width="400" height="300"></video>
      <button onClick={startCamera}>تشغيل الكاميرا</button>
      <button onClick={captureFace}>تسجيل</button>
    </div>
  );
}

export default Register;
