import React, { useRef, useEffect, useState } from "react";
import * as faceapi from "face-api.js";
import { db } from "./firebaseConfig";
import { collection, getDocs, addDoc } from "firebase/firestore";

function Attendance() {
  const videoRef = useRef();
  const labeledDescriptorsRef = useRef([]);
  const [modelsLoaded, setModelsLoaded] = useState(false);

useEffect(() => {
  const init = async () => {
    await loadModels();
    await loadUsers();
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
  } catch (error) {
  
    console.log(error);
  }
  setModelsLoaded(true);
};


  const startCamera = async () => {
    const stream = await navigator.mediaDevices.getUserMedia({ video: true });
    videoRef.current.srcObject = stream;

    videoRef.current.onplaying = () => {
      const canvasat = document.getElementById("overlayat");
      const displaySize = {
        width: videoRef.current.width,
        height: videoRef.current.height,
      };
      faceapi.matchDimensions(canvasat, displaySize);

      setInterval(async () => {
        if (modelsLoaded) {
          const detections = await faceapi
            .detectAllFaces(videoRef.current, new faceapi.SsdMobilenetv1Options())
            .withFaceLandmarks()
            .withFaceDescriptors();

          if (detections.length > 0) {
            const resizedDetections = faceapi.resizeResults(detections, displaySize);
            const context = canvasat.getContext("2d");
            context.clearRect(0, 0, canvasat.width, canvasat.height);

            // رسم المستطيلات والعلامات لكل وجه
            faceapi.draw.drawDetections(canvasat, resizedDetections);
            faceapi.draw.drawFaceLandmarks(canvasat, resizedDetections);
          }
        }
      }, 100);
    };
  };

  const loadUsers = async () => {
    
      const querySnapshot = await getDocs(collection(db, "users"));
      labeledDescriptorsRef.current = querySnapshot.docs.map(doc => {
        const data = doc.data();
        console.log("Loaded user:", data);
        return new faceapi.LabeledFaceDescriptors(
          data.name,
          [new Float32Array(data.descriptor)]
        );
      });
  };

  const recognizeFace = async () => {
    if (modelsLoaded) {
      const detections = await faceapi
        .detectAllFaces(videoRef.current, new faceapi.SsdMobilenetv1Options())
        .withFaceLandmarks()
        .withFaceDescriptors();

      if (detections.length > 0) {
if (!labeledDescriptorsRef.current || labeledDescriptorsRef.current.length === 0) {
  alert("لا يوجد بيانات وجوه مسجلة في قاعدة البيانات!");
  return;
}
         console.log(labeledDescriptorsRef.current );
const faceMatcher = new faceapi.FaceMatcher(labeledDescriptorsRef.current, 0.6);
        
        for (const d of detections) {
          const bestMatch = faceMatcher.findBestMatch(d.descriptor);
          if (bestMatch.label !== "unknown") {
            await addDoc(collection(db, "attendance"), {
              name: bestMatch.label,
              time: new Date().toISOString(),
            });
            alert(`تم تسجيل حضور: ${bestMatch.label}`);
          } else {
            alert("وجه غير مسجل!");
          }
        }
      } else {
        alert("لم يتم العثور على أي وجه!");
      }
    }
  };

  return (
    <div>
      <div style={{ position: "relative", width: "400px", height: "300px" }}>
        <video ref={videoRef} autoPlay width="400" height="300"></video>
        <canvas
          id="overlayat"
          width="400"
          height="300"
          style={{ position: "absolute", top: 0, left: 0 }}
        ></canvas>
      </div>

      <button onClick={startCamera}>تشغيل الكاميرا</button>
     <button onClick={() => {
  if (!modelsLoaded) {
    alert("النماذج لم تُحمَّل بعد!");
    return;
  }
  if (!labeledDescriptorsRef.current || labeledDescriptorsRef.current.length === 0) {
    alert("لم يتم تحميل بيانات المستخدمين بعد!");
    return;
  }
  recognizeFace();
}}>تسجيل حضور</button>

    </div>
  );
}

export default Attendance;
