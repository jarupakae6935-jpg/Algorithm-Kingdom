// firebase-config.js
// ภารกิจพิชิตอาณาจักรอัลกอริทึม (Algorithm Adventure - Grade 4)
// ใส่ Firebase Configuration ที่ต้องการเชื่อมต่อจริงที่นี่

const firebaseConfig = {
  apiKey: "AIzaSyC1yjNYZQk9S19A5142hosWjPulyVeXDtQ",
  authDomain: "algorithm-adventure-2bbec.firebaseapp.com",
  projectId: "algorithm-adventure-2bbec",
  storageBucket: "algorithm-adventure-2bbec.firebasestorage.app",
  messagingSenderId: "117641746509",
  appId: "1:117641746509:web:fb4ecef6f1fb6ae203a404"
};

// หากเรียกใช้ใน Browser
if (typeof window !== 'undefined') {
  window.FIREBASE_CONFIG = firebaseConfig;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = firebaseConfig;
}
