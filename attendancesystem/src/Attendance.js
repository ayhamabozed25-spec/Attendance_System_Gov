import React, { useRef, useEffect } from "react";
import * as faceapi from "face-api.js";
import { db } from "./firebaseConfig";
import { collection, getDocs, addDoc } from "firebase/firestore";

function Attendance() {
  const videoRef = useRef();
  let labeledDescriptors = [];

  useEffect(() => {
    startCamera();
    loadUsers();
  }, []);

  const startCamera = async () => {
    navigator.mediaDevices.getUserMedia({ video: true }).then(stream => {
      videoRef.current.srcObject = stream;
    });
  };

  const loadUsers = async () => {
    const querySnapshot = await getDocs(collection(db, "users"));
    labeledDescriptors = querySnapshot.docs.map(doc => {
      const data = doc.data();
      return new faceapi.LabeledFaceDescriptors(
        data.name,
        [new Float32Array(data.descriptor)]
      );
    });
  };

  const recognizeFace = async () => {
    const detections = await faceapi.detectSingleFace(videoRef.current).withFaceLandmarks().withFaceDescriptor();
    if (detections) {
      const faceMatcher = new faceapi.FaceMatcher(labeledDescriptors, 0.6);
      const bestMatch = faceMatcher.findBestMatch(detections.descriptor);
      if (bestMatch.label !== "unknown") {
        await addDoc(collection(db, "attendance"), {
          name: bestMatch.label,
          time: new Date().toISOString()
        });
        alert(`تم تسجيل حضور: ${bestMatch.label}`);
      } else {
        alert("الوجه غير مسجل!");
      }
    }
  };

  return (
    <div>
      <video ref={videoRef} autoPlay width="400" height="300"></video>
      <button onClick={recognizeFace}>تسجيل حضور</button>
    </div>
  );
}

export default Attendance;
