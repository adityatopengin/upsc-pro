// assets/js/firebase-config.js
// TODO: Replace with your actual Firebase project configuration from the Firebase Console
// Go to Firebase Console > Project Settings > General > "Your apps" > SDK Setup and Configuration

const firebaseConfig = {
    apiKey: "YOUR_API_KEY_HERE",
    authDomain: "your-project-id.firebaseapp.com",
    projectId: "your-project-id",
    storageBucket: "your-project-id.appspot.com",
    messagingSenderId: "123456789",
    appId: "1:123456789:web:abcdef123456"
};

// Initialize Firebase (We check if firebase is available to avoid errors in Local Mode)
let auth, db;

if (typeof firebase !== 'undefined') {
    firebase.initializeApp(firebaseConfig);
    auth = firebase.auth();
    db = firebase.firestore();
    console.log("Firebase initialized");
} else {
    console.warn("Firebase SDK not found. Running in Offline Mode.");
}
