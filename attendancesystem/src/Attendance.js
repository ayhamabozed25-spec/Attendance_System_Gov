import React, { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";
import { db, auth } from "./firebaseConfig";
import { doc, getDoc, addDoc, collection } from "firebase/firestore";

function Attendance() {
  const videoRef = useRef();
  const labeledDescriptorsRef = useRef([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);

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
      console.log("Models loaded");
      setModelsLoaded(true);
    } catch (error) {
      console.log(error);
    }
  };

 const startCamera = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({ video: true });
  videoRef.current.srcObject = stream;

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

      // استدعاء الحلقة التالية بشكل متزامن مع معدل تحديث الشاشة
      requestAnimationFrame(renderLoop);
    };

    // بدء الحلقة
    renderLoop();
  };
};


  // تحميل بيانات المستخدم الحالي فقط
  const loadCurrentUser = async () => {
    const user = auth.currentUser;
    if (!user) {
      alert("لم يتم تسجيل الدخول!");
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
      console.log("Loaded current user data:", data);
    } else {
      alert("لا يوجد بيانات وجه مسجلة لهذا المستخدم!");
    }
  };

  const recognizeFace = async () => {
    if (modelsLoaded) {
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.SsdMobilenetv1Options())
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length > 0) {
        if (!labeledDescriptorsRef.current || labeledDescriptorsRef.current.length === 0) {
          alert("لم يتم تحميل بيانات المستخدم الحالي!");
          return;
        }

        const faceMatcher = new faceapi.FaceMatcher(labeledDescriptorsRef.current, 0.6);

        for (const d of detections) {
          const bestMatch = faceMatcher.findBestMatch(d.descriptor);
          if (bestMatch.label !== "unknown") {
            const user = auth.currentUser;
            await addDoc(collection(db, "attendance"), {
              email: user.email,
              name: bestMatch.name,
              time: new Date().toISOString(),
            });
            alert(`تم تسجيل حضور: ${bestMatch.name} (${user.email})`);
          } else {
            alert("وجه غير مسجل لهذا المستخدم!");
          }
        }
      } else {
        alert("لم يتم العثور على أي وجه!");
      }
    }
  };

  return (
    <div>
      <div style={{ position: "relative", width: "100%", maxWidth: "400px" }}>
        <video
          ref={videoRef}
          autoPlay
          playsInline
          style={{ width: "100%", height: "auto" }}
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

      <button onClick={startCamera}>تشغيل الكاميرا</button>
      <button
        onClick={() => {
          if (!modelsLoaded) {
            alert("النماذج لم تُحمَّل بعد!");
            return;
          }
          if (!labeledDescriptorsRef.current || labeledDescriptorsRef.current.length === 0) {
            alert("لم يتم تحميل بيانات المستخدم الحالي!");
            return;
          }
          recognizeFace();
        }}
      >
        تسجيل حضور
      </button>
    </div>
  );
}

export default Attendance;
