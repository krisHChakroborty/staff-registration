import { db, storage } from "../firebase-config.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
  ref,
  uploadBytesResumable,
  getDownloadURL
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

const registerForm = document.getElementById("registerForm");
const message = document.getElementById("message");

const photoInput = document.getElementById("photo");
const idProofInput = document.getElementById("idProof");
const documentsInput = document.getElementById("documents");

const photoFileName = document.getElementById("photoFileName");
const idProofFileName = document.getElementById("idProofFileName");
const documentsFileName = document.getElementById("documentsFileName");

// ---------- FILE NAME SHOW ----------
if (photoInput) {
  photoInput.addEventListener("change", () => {
    photoFileName.textContent = photoInput.files.length
      ? photoInput.files[0].name
      : "No photo selected";
  });
}

if (idProofInput) {
  idProofInput.addEventListener("change", () => {
    idProofFileName.textContent = idProofInput.files.length
      ? idProofInput.files[0].name
      : "No ID proof selected";
  });
}

if (documentsInput) {
  documentsInput.addEventListener("change", () => {
    if (!documentsInput.files.length) {
      documentsFileName.textContent = "No documents selected";
      return;
    }
    documentsFileName.textContent = Array.from(documentsInput.files)
      .map(file => file.name)
      .join(", ");
  });
}

// ---------- UPLOAD SINGLE FILE ----------
function uploadSingleFile(file, folderName) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve({ name: "", url: "" });
      return;
    }

    const uniqueName = `${Date.now()}_${file.name}`;
    const fileRef = ref(storage, `${folderName}/${uniqueName}`);
    const uploadTask = uploadBytesResumable(fileRef, file);

    uploadTask.on(
      "state_changed",
      (snapshot) => {
        const progress = Math.round(
          (snapshot.bytesTransferred / snapshot.totalBytes) * 100
        );
        console.log(`Uploading ${file.name}: ${progress}%`);
        message.textContent = `Uploading ${file.name}... ${progress}%`;
      },
      (error) => {
        console.error("Upload error:", error);
        reject(error);
      },
      async () => {
        try {
          const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
          resolve({
            name: file.name,
            url: downloadURL
          });
        } catch (err) {
          reject(err);
        }
      }
    );
  });
}

// ---------- UPLOAD MULTIPLE FILES ----------
async function uploadMultipleFiles(files, folderName) {
  if (!files || !files.length) return [];

  const uploaded = [];
  for (const file of files) {
    const data = await uploadSingleFile(file, folderName);
    uploaded.push(data);
  }
  return uploaded;
}

// ---------- REGISTER ----------
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

  message.style.color = "#ffffff";
  message.textContent = "Starting upload...";

  try {
    const employeeFolder = `employees/${fullName.replace(/\s+/g, "_")}_${Date.now()}`;

    // Photo
    const photoData = await uploadSingleFile(
      photoInput && photoInput.files.length ? photoInput.files[0] : null,
      `${employeeFolder}/photo`
    );

    // ID Proof
    const idProofData = await uploadSingleFile(
      idProofInput && idProofInput.files.length ? idProofInput.files[0] : null,
      `${employeeFolder}/id-proof`
    );

    // Documents
    const documentsData = await uploadMultipleFiles(
      documentsInput && documentsInput.files.length ? Array.from(documentsInput.files) : [],
      `${employeeFolder}/documents`
    );

    message.textContent = "Saving employee data...";

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

      photoName: photoData.name || "",
      photoURL: photoData.url || "",

      idProofName: idProofData.name || "",
      idProofURL: idProofData.url || "",

      documents: documentsData,
      createdAt: serverTimestamp()
    };

    await addDoc(collection(db, "employees"), employeeData);

    message.style.color = "#4CAF50";
    message.textContent = "Employee registered successfully!";

    registerForm.reset();
    if (photoFileName) photoFileName.textContent = "No photo selected";
    if (idProofFileName) idProofFileName.textContent = "No ID proof selected";
    if (documentsFileName) documentsFileName.textContent = "No documents selected";

  } catch (error) {
    console.error("Error saving employee:", error);
    message.style.color = "#ff4d4d";
    message.textContent = "Failed: " + error.message;
  }
});