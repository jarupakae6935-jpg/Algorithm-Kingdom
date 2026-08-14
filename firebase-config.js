// firebase-config.js
// ภารกิจพิชิตอาณาจักรอัลกอริทึม (Algorithm Adventure - Grade 4)
// ใส่ Firebase Configuration ที่ต้องการเชื่อมต่อจริงที่นี่

const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
};

// หากเรียกใช้ใน Browser
if (typeof window !== 'undefined') {
  window.FIREBASE_CONFIG = firebaseConfig;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = firebaseConfig;
}
