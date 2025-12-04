// === Initialize Firebase ===

const firebaseConfig = {
  apiKey: "placeholder",
  authDomain: "placeholder",
  projectId: "placeholder",
  storageBucket: "placeholder",
  messagingSenderId: "placeholder",
  appId: "placeholder"
};

// Global firebase object (from compat CDN)
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
