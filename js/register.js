import { db } from "../firebase-config.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const registerForm = document.getElementById("registerForm");
const message = document.getElementById("message");

const photoInput = document.getElementById("photo");
const idProofInput = document.getElementById("idProof");
const documentsInput = document.getElementById("documents");

const photoFileName = document.getElementById("photoFileName");
const idProofFileName = document.getElementById("idProofFileName");
const documentsFileName = document.getElementById("documentsFileName");

// -------------------- FILE NAME SHOW --------------------
photoInput.addEventListener("change", () => {
  photoFileName.textContent = photoInput.files.length
    ? photoInput.files[0].name
    : "No photo selected";
});

idProofInput.addEventListener("change", () => {
  idProofFileName.textContent = idProofInput.files.length
    ? idProofInput.files[0].name
    : "No ID proof selected";
});

documentsInput.addEventListener("change", () => {
  if (!documentsInput.files.length) {
    documentsFileName.textContent = "No documents selected";
    return;
  }

  const names = Array.from(documentsInput.files).map(file => file.name);
  documentsFileName.textContent = names.join(", ");
});

// -------------------- REGISTER EMPLOYEE --------------------
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

  // IMPORTANT: sirf names save honge, raw file object nahi
  const photoName = photoInput.files.length ? photoInput.files[0].name : "";
  const idProofName = idProofInput.files.length ? idProofInput.files[0].name : "";
  const documentNames = documentsInput.files.length
    ? Array.from(documentsInput.files).map(file => file.name)
    : [];

  // Firestore-safe data object
  const employeeData = {
    fullName,
    email,
    mobile,
    emergencyContact,
    address,
    designation,
    experienceType,
    outletName,
    salary: Number(salary) || 0,
    idType,
    idNumber,

    photoName,
    idProofName,
    documentNames,

    createdAt: serverTimestamp()
  };

  message.style.color = "#ffffff";
  message.textContent = "Saving employee...";

  try {
    await addDoc(collection(db, "employees"), employeeData);

    message.style.color = "#4CAF50";
    message.textContent = "Employee registered successfully!";

    registerForm.reset();
    photoFileName.textContent = "No photo selected";
    idProofFileName.textContent = "No ID proof selected";
    documentsFileName.textContent = "No documents selected";
  } catch (error) {
    console.error("Error saving employee:", error);
    message.style.color = "#ff4d4d";
    message.textContent = "Failed to register employee: " + error.message;
  }
});