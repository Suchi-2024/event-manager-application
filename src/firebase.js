import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

const firebaseConfig = {
  apiKey: "AIzaSyCEUYfSsssfvhgSuMSRSoLJNVptcr1J-_A",
  authDomain: "event-manager-685f6.firebaseapp.com",
  projectId: "event-manager-685f6",
  storageBucket: "event-manager-685f6.appspot.com",
  messagingSenderId: "180815936916",
  appId: "1:180815936916:web:66d3d2c1e4aab266ad6381",
  measurementId: "G-JB2ZT8TZ2L",
};
const app = initializeApp(firebaseConfig);
// You can REMOVE analytics (it's not needed for auth/database):
// const analytics = getAnalytics(app);

export const auth = getAuth(app);
export const db = getFirestore(app);
