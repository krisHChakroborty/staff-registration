import { db } from "../firebase-config.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

const registerForm = document.getElementById("registerForm");
const message = document.getElementById("message");

registerForm.addEventListener("submit", async (e) => {
  e.preventDefault();

  const fullName = document.getElementById("fullName").value.trim();
  const email = document.getElementById("email").value.trim();
  const mobile = document.getElementById("mobile").value.trim();
  const emergencyContact = document.getElementById("emergencyContact").value.trim();
  const address = document.getElementById("address").value.trim();
  const designation = document.getElementById("designation").value.trim();
  const experienceType = document.getElementById("experienceType").value;
  const outletName = document.getElementById("outletName").value.trim();
  const salary = document.getElementById("salary").value.trim();
  const idType = document.getElementById("idType").value;
  const idNumber = document.getElementById("idNumber").value.trim();

  if (!fullName || !mobile || !designation || !experienceType) {
    message.style.color = "#ff5c5c";
    message.textContent = "Please fill all required fields.";
    return;
  }

  message.style.color = "#ffffff";
  message.textContent = "Saving employee...";

  try {
    const employeeData = {
      fullName,
      email,
      mobile,
      emergencyContact,
      address,
      designation,
      experienceType,
      outletName,
      salary: salary ? Number(salary) : 0,
      idType,
      idNumber,
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, "employees"), employeeData);

    message.style.color = "#4CAF50";
    message.textContent = "Employee registered successfully!";
    registerForm.reset();

  } catch (error) {
    console.error("Error saving employee:", error);
    message.style.color = "#ff5c5c";
    message.textContent = "Save failed: " + error.message;
  }
});