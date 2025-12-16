import { getApp, getApps, initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyDXpb5fB4Tjlj59CwAhySMF6EhsBtNhAzw",
  authDomain: "moodfeed-eab30.firebaseapp.com",
  projectId: "moodfeed-eab30",
  storageBucket: "moodfeed-eab30.firebasestorage.app",
  messagingSenderId: "617243220622",
  appId: "1:617243220622:web:bb30552ba4aa1125b0c7df",
  measurementId: "G-FREC2GS763"
};

const requiredKeys: Array<keyof typeof firebaseConfig> = [
  "apiKey",
  "authDomain",
  "projectId",
  "storageBucket",
  "messagingSenderId",
  "appId",
];

const missingKey = requiredKeys.find(
  (key) => !firebaseConfig[key]
);

if (missingKey) {
  throw new Error(
    `Falta la variable de entorno Firebase: ${missingKey}`
  );
}

const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);
export const auth = getAuth(app);

