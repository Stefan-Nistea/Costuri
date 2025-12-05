// === Initialize Firebase ===

const firebaseConfig = {
  apiKey: "AIzaSyBPlvpD9QU-uyspsbab-YDzeR3P6GturC8",
  authDomain: "expenseflow-479418.firebaseapp.com",
  projectId: "expenseflow-479418",
  storageBucket: "expenseflow-479418.firebasestorage.app",
  messagingSenderId: "889298108360",
  appId: "1:889298108360:web:1f4d391fb6b0a7aa298afd"
};

// Global firebase object (from compat CDN)
const app = firebase.initializeApp(firebaseConfig);
const db = firebase.firestore();
