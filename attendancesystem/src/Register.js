import React, { useRef, useState, useEffect } from "react";
import * as faceapi from "face-api.js";
import { db } from "./firebaseConfig";
import { setDoc, doc } from "firebase/firestore";

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
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;

    videoRef.current.onplaying = () => {
      const canvas = document.getElementById("overlay");
      const displaySize = {
        width: videoRef.current.width,
        height: videoRef.current.height,
      };
      faceapi.matchDimensions(canvas, displaySize);

      setInterval(async () => {
        if (modelsLoaded) {
          const detections = await faceapi
            .detectAllFaces(videoRef.current)
            .withFaceLandmarks()
            .withFaceDescriptors();

          const resizedDetections = faceapi.resizeResults(detections, displaySize);
          const context = canvas.getContext("2d");
          context.clearRect(0, 0, canvas.width, canvas.height);

          faceapi.draw.drawDetections(canvas, resizedDetections);
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        }
      }, 100); // يحدث كل 100ms للرسم فقط
    };
  };

  const captureFace = async () => {
    if (!modelsLoaded) {
      alert("النماذج لم تُحمّل بعد، انتظر قليلاً...");
      return;
    }

    if (!name || name.trim() === "") {
      alert("الرجاء إدخال اسم قبل التسجيل");
      return;
    }

    const detections = await faceapi
      .detectAllFaces(videoRef.current)
      .withFaceLandmarks()
      .withFaceDescriptors();

    if (detections.length > 0) {
      // حفظ أول وجه فقط عند الضغط على زر التسجيل
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
        onChange={(e) => setName(e.target.value)}
      />
      <div style={{ position: "relative", width: "400px", height: "300px" }}>
        <video ref={videoRef} autoPlay width="400" height="300"></video>
        <canvas
          id="overlay"
          width="400"
          height="300"
          style={{ position: "absolute", top: 0, left: 0 }}
        ></canvas>
      </div>
      <button onClick={startCamera}>تشغيل الكاميرا</button>
      <button onClick={captureFace}>تسجيل</button>
    </div>
  );
}

export default Register;
