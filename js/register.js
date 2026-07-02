import { db, storage } from "../firebase-config.js";
import {
  collection,
  addDoc,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
  ref,
  uploadBytes,
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

// -------------------- HELPER: FILE UPLOAD --------------------
async function uploadSingleFile(file, folderPath) {
  if (!file) return null;

  const fileName = `${Date.now()}-${file.name}`;
  const storageRef = ref(storage, `${folderPath}/${fileName}`);

  await uploadBytes(storageRef, file);
  const downloadURL = await getDownloadURL(storageRef);

  return {
    name: file.name,
    url: downloadURL,
    storagePath: storageRef.fullPath
  };
}

async function uploadMultipleFiles(files, folderPath) {
  if (!files || !files.length) return [];

  const uploadedFiles = [];

  for (const file of files) {
    const uploaded = await uploadSingleFile(file, folderPath);
    if (uploaded) {
      uploadedFiles.push(uploaded);
    }
  }

  return uploadedFiles;
}

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

  message.style.color = "#ffffff";
  message.textContent = "Uploading files and saving employee...";

  try {
    const safeName = fullName.replace(/\s+/g, "_").toLowerCase();
    const baseFolder = `employees/${safeName}_${Date.now()}`;

    // Upload photo
    const photoData = photoInput.files.length
      ? await uploadSingleFile(photoInput.files[0], `${baseFolder}/photo`)
      : null;

    // Upload ID proof
    const idProofData = idProofInput.files.length
      ? await uploadSingleFile(idProofInput.files[0], `${baseFolder}/id-proof`)
      : null;

    // Upload other documents
    const documentsData = documentsInput.files.length
      ? await uploadMultipleFiles(Array.from(documentsInput.files), `${baseFolder}/documents`)
      : [];

    // Save employee data to Firestore
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

      photo: photoData
        ? {
            name: photoData.name,
            url: photoData.url,
            storagePath: photoData.storagePath
          }
        : null,

      idProof: idProofData
        ? {
            name: idProofData.name,
            url: idProofData.url,
            storagePath: idProofData.storagePath
          }
        : null,

      documents: documentsData, // [{name, url, storagePath}, ...]

      createdAt: serverTimestamp()
    };

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