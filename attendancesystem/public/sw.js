const CACHE_NAME = "face-models-cache-v1";
const urlsToCache = [
  "/Attendance_System_Gov/models/ssd_mobilenetv1_model-weights_manifest.json",
  "/Attendance_System_Gov/models/ssd_mobilenetv1_model-shard1",
  "/Attendance_System_Gov/models/ssd_mobilenetv1_model-shard2",
  "/Attendance_System_Gov/models/face_landmark_68_model-weights_manifest.json",
  "/Attendance_System_Gov/models/face_landmark_68_model-shard1",
  "/Attendance_System_Gov/models/face_recognition_model-weights_manifest.json",
  "/Attendance_System_Gov/models/face_recognition_model-shard1",
  "/Attendance_System_Gov/models/face_recognition_model-shard2"
];

self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return Promise.all(
        urlsToCache.map(url =>
          cache.add(url).catch(err => console.error("❌ Failed to cache:", url, err))
        )
      );
    })
  );
});

self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
