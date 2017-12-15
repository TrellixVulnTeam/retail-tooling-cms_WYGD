// // Initialize Firebase
// // TODO: Replace with your project's customized code snippet
var firebaseConfig = {
  apiKey: "AIzaSyC1oK8OilCE_f6tBdsKkCSEScjnhNWVelU",
  authDomain: "retail-tooling-cms.firebaseapp.com",
  databaseURL: "https://retail-tooling-cms.firebaseio.com",
  projectId: "retail-tooling-cms",
  storageBucket: "retail-tooling-cms.appspot.com",
  messagingSenderId: "73299715568"
};
firebase.initializeApp(firebaseConfig);

// Initialize Cloud Firestore through Firebase
var db = firebase.firestore();
