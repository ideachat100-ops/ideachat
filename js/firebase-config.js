// Import the functions you need from the SDKs you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-app.js";
import { getDatabase, ref, set, get, push, remove, update, child, onValue } from "https://www.gstatic.com/firebasejs/10.9.0/firebase-database.js";

// TODO: Replace this with your actual Firebase config object
// You can find this in your Firebase Console -> Project Settings
const firebaseConfig = {
  apiKey: "AIzaSyDO3TONbFh4895cy5W869vSCtuNwf2uYj4",
  authDomain: "idea-chat-c32fb.firebaseapp.com",
  databaseURL: "https://idea-chat-c32fb-default-rtdb.firebaseio.com",
  projectId: "idea-chat-c32fb",
  storageBucket: "idea-chat-c32fb.firebasestorage.app",
  messagingSenderId: "339495381977",
  appId: "1:339495381977:web:12bae601dcdbb5690547c8"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

// ImgBB API Key
export const IMGBB_API_KEY = 'bf7a5ef08123bdb799fa62ded551cf3e';

export { app, database, ref, set, get, push, remove, update, child, onValue };
