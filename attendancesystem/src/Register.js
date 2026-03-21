import React, { useRef, useState, useEffect } from "react";
import * as faceapi from "face-api.js";
import { db, auth } from "./firebaseConfig";
import { setDoc, doc } from "firebase/firestore";

function Register() {
  const videoRef = useRef();
  const [name, setName] = useState("");
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");

  // تحميل النماذج عند بداية التشغيل
  useEffect(() => {
    const loadModels = async () => {
      try {
        const MODEL_URL = process.env.PUBLIC_URL + "/models";
        await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
        await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
        await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
        setModelsLoaded(true);
        setStatusMessage("✅ تم تحميل النماذج بنجاح");
      } catch (error) {
        setStatusMessage("❌ خطأ في تحميل النماذج");
      }
    };
    loadModels();
  }, []);

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
    setStatusMessage("🎥 الكاميرا تعمل الآن");

    videoRef.current.onplaying = () => {
      const canvas = document.getElementById("overlay");
      const displaySize = {
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
      };
      faceapi.matchDimensions(canvas, displaySize);

      const renderLoop = async () => {
        if (modelsLoaded) {
          const detection = await faceapi
            .detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options())
            .withFaceLandmarks()
            .withFaceDescriptor();

          const context = canvas.getContext("2d");
          context.clearRect(0, 0, canvas.width, canvas.height);

          if (detection) {
            const resizedDetection = faceapi.resizeResults(detection, displaySize);
            faceapi.draw.drawDetections(canvas, resizedDetection);
            faceapi.draw.drawFaceLandmarks(canvas, resizedDetection);
          }
        }
        requestAnimationFrame(renderLoop);
      };

      renderLoop();
    };
  };

  const captureFace = async () => {
    if (!modelsLoaded) {
      setStatusMessage("⚠️ النماذج لم تُحمّل بعد، انتظر قليلاً...");
      return;
    }

    if (!name || name.trim() === "") {
      setStatusMessage("⚠️ الرجاء إدخال اسم قبل التسجيل");
      return;
    }

    const user = auth.currentUser;
    if (!user || !user.email) {
      setStatusMessage("❌ لم يتم العثور على مستخدم مسجّل دخول!");
      return;
    }

    const detection = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (detection) {
      await setDoc(doc(db, "users", user.uid), {
        email: user.email,
        name,
        descriptor: Array.from(detection.descriptor),
      });
      setStatusMessage(`✅ تم تسجيل المستخدم ${name} (${user.email}) بنجاح!`);
    } else {
      setStatusMessage("❌ لم يتم التعرف على وجه، حاول مرة أخرى.");
    }
  };

  return (
    <div style={{ textAlign: "center", fontFamily: "Arial, sans-serif", marginTop: "20px" }}>
      <h2 style={{ color: "#2c3e50" }}>📝 تسجيل مستخدم جديد</h2>

      <input
        type="text"
        placeholder="أدخل اسمك"
        onChange={(e) => setName(e.target.value)}
        style={{
          padding: "10px",
          margin: "10px",
          borderRadius: "5px",
          border: "1px solid #ccc",
          width: "250px",
          fontSize: "16px",
        }}
      />

      <div style={{ position: "relative", width: "100%", maxWidth: "600px", margin: "20px auto" }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{
            width: "100%",
            height: "auto",
            borderRadius: "10px",
            border: "2px solid #3498db",
          }}
          onLoadedMetadata={() => {
            const canvas = document.getElementById("overlay");
            if (videoRef.current) {
              canvas.width = videoRef.current.videoWidth;
              canvas.height = videoRef.current.videoHeight;
            }
          }}
        ></video>
        <canvas
          id="overlay"
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: "100%",
            height: "100%",
          }}
        ></canvas>
      </div>

      <div style={{ marginTop: "20px" }}>
        <button
          onClick={startCamera}
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
          🎥 تشغيل الكاميرا
        </button>

        <button
          onClick={captureFace}
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
          ✅ تسجيل
        </button>
      </div>

      {/* شريط الحالة */}
      <div
        style={{
          marginTop: "30px",
          padding: "10px",
          backgroundColor: "#ecf0f1",
          borderRadius: "5px",
          border: "1px solid #bdc3c7",
          maxWidth: "500px",
          margin: "20px auto",
          fontSize: "15px",
          color: "#2c3e50",
        }}
      >
        {statusMessage || "ℹ️ لا توجد رسائل حالياً"}
      </div>
    </div>
  );
}

export default Register;
