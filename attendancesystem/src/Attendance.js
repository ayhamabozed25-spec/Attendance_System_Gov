import React, { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";
import { db } from "./firebaseConfig";
import { collection, getDocs, addDoc } from "firebase/firestore";

function Attendance() {
  const videoRef = useRef();
  const canvasRef = useRef();
  const labeledDescriptorsRef = useRef([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);

  useEffect(() => {
    loadModels();
    startCamera();
    loadUsers();
  }, []);

  const loadModels = async () => {
    const MODEL_URL = process.env.PUBLIC_URL + "/models";
    await faceapi.nets.ssdMobilenetv1.loadFromUri(MODEL_URL);
    await faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL);
    await faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL);
    setModelsLoaded(true);
    console.log("Models loaded successfully");
  };

  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;

    videoRef.current.onplaying = () => {
      const canvas = canvasRef.current;
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

          // رسم المستطيل حول الوجه
          faceapi.draw.drawDetections(canvas, resizedDetections);
          // رسم العلامات (العينين، الأنف، إلخ)
          faceapi.draw.drawFaceLandmarks(canvas, resizedDetections);
        }
      }, 100);
    };
  };

  const loadUsers = async () => {
    const querySnapshot = await getDocs(collection(db, "users"));
    labeledDescriptorsRef.current = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return new faceapi.LabeledFaceDescriptors(
        data.name,
        [new Float32Array(data.descriptor)]
      );
    });
  };

  const recognizeFace = async () => {
    const detections = await faceapi
      .detectSingleFace(videoRef.current)
      .withFaceLandmarks()
      .withFaceDescriptor();
    if (detections) {
      const faceMatcher = new faceapi.FaceMatcher(labeledDescriptorsRef.current, 0.6);
      const bestMatch = faceMatcher.findBestMatch(detections.descriptor);
      if (bestMatch.label !== "unknown") {
        await addDoc(collection(db, "attendance"), {
          name: bestMatch.label,
          time: new Date().toISOString(),
        });
        alert(`تم تسجيل حضور: ${bestMatch.label}`);
      } else {
        alert("الوجه غير مسجل!");
      }
    }
  };

  return (
    <div style={{ position: "relative", width: "400px", height: "300px" }}>
      <video ref={videoRef} autoPlay width="400" height="300"></video>
      <canvas
        ref={canvasRef}
        width="400"
        height="300"
        style={{ position: "absolute", top: 0, left: 0 }}
      ></canvas>
      <button onClick={recognizeFace}>تسجيل حضور</button>
    </div>
  );
}

export default Attendance;
