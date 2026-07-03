import { db } from "../firebase-config.js";
import {
  doc,
  getDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const loadingMessage = document.getElementById("loadingMessage");
const employeeDetails = document.getElementById("employeeDetails");

const params = new URLSearchParams(window.location.search);
const employeeId = params.get("id");

async function loadEmployeeDetails() {
  if (!employeeId) {
    loadingMessage.textContent = "Employee ID not found in URL.";
    return;
  }

  try {
    const employeeRef = doc(db, "employees", employeeId);
    const employeeSnap = await getDoc(employeeRef);

    if (!employeeSnap.exists()) {
      loadingMessage.textContent = "Employee not found.";
      return;
    }

    const data = employeeSnap.data();

    document.getElementById("detailFullName").textContent = data.fullName || "-";
    document.getElementById("detailEmail").textContent = data.email || "-";
    document.getElementById("detailMobile").textContent = data.mobile || "-";
    document.getElementById("detailEmergency").textContent = data.emergencyContact || "-";
    document.getElementById("detailAddress").textContent = data.address || "-";

    document.getElementById("detailDesignation").textContent = data.designation || "-";
    document.getElementById("detailExperience").textContent = data.experienceType || "-";
    document.getElementById("detailOutlet").textContent = data.outletName || "-";
    document.getElementById("detailSalary").textContent =
      data.salary ? `₹${data.salary}` : "-";

    document.getElementById("detailIdType").textContent = data.idType || "-";
    document.getElementById("detailIdNumber").textContent = data.idNumber || "-";

    document.getElementById("detailPhoto").textContent = data.photoName || "No photo uploaded";
    document.getElementById("detailIdProof").textContent = data.idProofName || "No ID proof uploaded";

    document.getElementById("detailDocuments").textContent =
      data.documentNames && data.documentNames.length
        ? data.documentNames.join(", ")
        : "No documents uploaded";

    loadingMessage.style.display = "none";
    employeeDetails.style.display = "block";
  } catch (error) {
    console.error("Error loading employee details:", error);
    loadingMessage.textContent = "Failed to load employee details.";
  }
}

loadEmployeeDetails();