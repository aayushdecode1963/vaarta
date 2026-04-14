import { initializeApp } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/10.7.1/firebase-auth.js";

const firebaseConfig = {
    apiKey: "AIzaSyCJtYBNXYPyL9DVlNlauCtMbeySb2Ybhnk",
    authDomain: "vaarta-5766d.firebaseapp.com",
    projectId: "vaarta-5766d",
    storageBucket: "vaarta-5766d.firebasestorage.app",
    messagingSenderId: "731127951921",
    appId: "1:731127951921:web:09897539e545402d479b10"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);