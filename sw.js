const CACHE_NAME = "face-models-cache-v1";
const urlsToCache = [
 process.env.PUBLIC_URL +"/models/ssd_mobilenetv1_model-weights_manifest.json",
 process.env.PUBLIC_URL + "/models/ssd_mobilenetv1_model-shard1.bin",
 process.env.PUBLIC_URL + "/models/face_landmark_68_model-weights_manifest.json",
  process.env.PUBLIC_URL +"/models/face_landmark_68_model-shard1.bin",
  process.env.PUBLIC_URL +"/models/face_recognition_model-weights_manifest.json",
 process.env.PUBLIC_URL + "/models/face_recognition_model-shard1.bin"
];

// عند التثبيت، خزّن الملفات في الكاش
self.addEventListener("install", event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(urlsToCache);
    })
  );
});

// عند أي طلب، حاول أولاً من الكاش ثم من الشبكة
self.addEventListener("fetch", event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
