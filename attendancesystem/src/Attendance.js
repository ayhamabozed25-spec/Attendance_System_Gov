import React, { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";
import { db, auth } from "./firebaseConfig";
import { doc, getDoc, addDoc, collection } from "firebase/firestore";

function Attendance() {
  const videoRef = useRef();
  const labeledDescriptorsRef = useRef([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);
  const [statusMessage, setStatusMessage] = useState(""); // شريط الحالة

  useEffect(() => {
    const init = async () => {
      await loadModels();
      await loadCurrentUser();
    };
    init();
  }, []);

  const loadModels = async () => {
    try {
      const MODEL_URL = process.env.PUBLIC_URL + "/models";
      await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
      await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
      await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
      setStatusMessage("✅ النماذج تم تحميلها بنجاح");
      setModelsLoaded(true);
    } catch (error) {
      setStatusMessage("❌ خطأ في تحميل النماذج");
      console.log(error);
    }
  };

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;
    setStatusMessage("🎥 الكاميرا تعمل الآن");

    videoRef.current.onplaying = () => {
      const canvasat = document.getElementById("overlayat");
      const displaySize = {
        width: videoRef.current.videoWidth,
        height: videoRef.current.videoHeight,
      };
      faceapi.matchDimensions(canvasat, displaySize);

      const renderLoop = async () => {
        if (modelsLoaded) {
          const detections = await faceapi
            .detectAllFaces(videoRef.current, new faceapi.SsdMobilenetv1Options())
            .withFaceLandmarks()
            .withFaceDescriptors();

          const context = canvasat.getContext("2d");
          context.clearRect(0, 0, canvasat.width, canvasat.height);

          if (detections.length > 0) {
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            faceapi.draw.drawDetections(canvasat, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvasat, resizedDetections);
          }
        }
        requestAnimationFrame(renderLoop);
      };

      renderLoop();
    };
  };

  const loadCurrentUser = async () => {
    const user = auth.currentUser;
    if (!user) {
      setStatusMessage("⚠️ لم يتم تسجيل الدخول!");
      return;
    }

    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (userDoc.exists()) {
      const data = userDoc.data();
      labeledDescriptorsRef.current = [
        new faceapi.LabeledFaceDescriptors(
          user.email,
          [new Float32Array(data.descriptor)]
        ),
      ];
      setStatusMessage(`✅ تم تحميل بيانات المستخدم: ${data.name}`);
    } else {
      setStatusMessage("❌ لا يوجد بيانات وجه مسجلة لهذا المستخدم!");
    }
  };

  const recognizeFace = async () => {
    if (!modelsLoaded) {
      setStatusMessage("⚠️ النماذج لم تُحمَّل بعد!");
      return;
    }

    const detection = await faceapi
      .detectSingleFace(videoRef.current, new faceapi.SsdMobilenetv1Options())
      .withFaceLandmarks()
      .withFaceDescriptor();

    if (!detection) {
      setStatusMessage("❌ لم يتم العثور على أي وجه!");
      return;
    }

    if (!labeledDescriptorsRef.current || labeledDescriptorsRef.current.length === 0) {
      setStatusMessage("⚠️ لم يتم تحميل بيانات المستخدم الحالي!");
      return;
    }

    const faceMatcher = new faceapi.FaceMatcher(labeledDescriptorsRef.current, 0.6);
    const bestMatch = faceMatcher.findBestMatch(detection.descriptor);

    if (bestMatch.label !== "unknown") {
      const user = auth.currentUser;
      const userDoc = await getDoc(doc(db, "users", user.uid));
      const data = userDoc.data();

      await addDoc(collection(db, "attendance"), {
        email: user.email,
        name: data.name,
        time: new Date().toISOString(),
      });

      setStatusMessage(`✅ تم تسجيل حضور: ${data.name} (${user.email})`);
    } else {
      setStatusMessage("❌ وجه غير مسجل لهذا المستخدم!");
    }
  };

  return (
    <div style={{ textAlign: "center", fontFamily: "Arial, sans-serif", marginTop: "20px" }}>
      <h2 style={{ color: "#2c3e50" }}>📌 نظام تسجيل الحضور</h2>

      <div style={{ position: "relative", width: "100%", maxWidth: "500px", margin: "20px auto" }}>
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
            const canvas = document.getElementById("overlayat");
            if (videoRef.current) {
              canvas.width = videoRef.current.videoWidth;
              canvas.height = videoRef.current.videoHeight;
            }
          }}
        ></video>
        <canvas
          id="overlayat"
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
          onClick={recognizeFace}
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
          ✅ تسجيل حضور
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

export default Attendance;
