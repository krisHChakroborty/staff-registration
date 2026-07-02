import { auth } from "../firebase-config.js";
import { signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const loginForm = document.getElementById("loginForm");
const message = document.getElementById("message");

loginForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();

  message.style.color = "#ffffff";
  message.textContent = "Logging in...";

  try {
    await signInWithEmailAndPassword(auth, email, password);

    message.style.color = "#4CAF50";
    message.textContent = "Login successful! Redirecting...";

    setTimeout(() => {
      window.location.href = "dashboard.html";
    }, 1200);

  } catch (error) {
    message.style.color = "#ff4d4d";

    if (error.code === "auth/invalid-credential") {
      message.textContent = "Invalid email or password.";
    } else if (error.code === "auth/user-not-found") {
      message.textContent = "Admin account not found.";
    } else if (error.code === "auth/wrong-password") {
      message.textContent = "Wrong password.";
    } else {
      message.textContent = error.message;
    }
  }
});