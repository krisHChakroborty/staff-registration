import { auth, db } from "../firebase-config.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

// ---------- Top buttons / table ----------
const logoutBtn = document.getElementById("logoutBtn");
const employeeTableBody = document.getElementById("employeeTableBody");
const totalEmployees = document.getElementById("totalEmployees");

// ---------- Main modal ----------
const employeeModal = document.getElementById("employeeModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const modalEmployeeTitle = document.getElementById("modalEmployeeTitle");

// ---------- Preview modal ----------
const previewModal = document.getElementById("previewModal");
const closePreviewBtn = document.getElementById("closePreviewBtn");
const previewBody = document.getElementById("previewBody");

// ---------- Main action buttons ----------
const editEmployeeBtn = document.getElementById("editEmployeeBtn");
const saveEmployeeBtn = document.getElementById("saveEmployeeBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

// ---------- Filters ----------
const searchName = document.getElementById("searchName");
const searchOutlet = document.getElementById("searchOutlet");
const searchJoiningDateFrom = document.getElementById("searchJoiningDateFrom");
const searchJoiningDateTo = document.getElementById("searchJoiningDateTo");
const searchBtn = document.getElementById("searchBtn");
const resetBtn = document.getElementById("resetBtn");

// ---------- Profile view elements ----------
const modalPhotoPreview = document.getElementById("modalPhotoPreview");
const zoomPhotoBtn = document.getElementById("zoomPhotoBtn");
const downloadPhotoBtn = document.getElementById("downloadPhotoBtn");

const viewFullName = document.getElementById("viewFullName");
const viewEmail = document.getElementById("viewEmail");
const viewMobile = document.getElementById("viewMobile");
const viewEmergency = document.getElementById("viewEmergency");
const viewAddress = document.getElementById("viewAddress");
const viewDesignation = document.getElementById("viewDesignation");
const viewExperience = document.getElementById("viewExperience");
const viewOutlet = document.getElementById("viewOutlet");
const viewSalary = document.getElementById("viewSalary");
const viewIdType = document.getElementById("viewIdType");
const viewIdNumber = document.getElementById("viewIdNumber");

// ---------- Edit inputs ----------
const editFullName = document.getElementById("editFullName");
const editEmail = document.getElementById("editEmail");
const editMobile = document.getElementById("editMobile");
const editEmergency = document.getElementById("editEmergency");
const editAddress = document.getElementById("editAddress");
const editDesignation = document.getElementById("editDesignation");
const editExperience = document.getElementById("editExperience");
const editOutlet = document.getElementById("editOutlet");
const editSalary = document.getElementById("editSalary");
const editIdType = document.getElementById("editIdType");
const editIdNumber = document.getElementById("editIdNumber");

// ---------- Upload edit sections ----------
const editPhotoWrap = document.getElementById("editPhotoWrap");
const editIdProofWrap = document.getElementById("editIdProofWrap");
const editDocumentsWrap = document.getElementById("editDocumentsWrap");

const editPhotoInput = document.getElementById("editPhotoInput");
const editIdProofInput = document.getElementById("editIdProofInput");
const editDocumentsInput = document.getElementById("editDocumentsInput");

// ---------- Document sections ----------
const idProofPreviewArea = document.getElementById("idProofPreviewArea");
const downloadIdProofBtn = document.getElementById("downloadIdProofBtn");
const documentsGrid = document.getElementById("documentsGrid");

// ---------- State ----------
let employeesCache = [];
let currentEmployee = null;
let editMode = false;

// =====================================================
// Logout
// =====================================================
if (logoutBtn) {
  logoutBtn.addEventListener("click", async () => {
    try {
      await signOut(auth);
      window.location.href = "login.html";
    } catch (error) {
      alert("Logout failed: " + error.message);
    }
  });
}

// =====================================================
// Helpers
// =====================================================
function isImage(type = "", dataUrl = "", fileName = "") {
  return (
    type.startsWith("image/") ||
    dataUrl.startsWith("data:image") ||
    /\.(jpg|jpeg|png|gif|webp)$/i.test(fileName)
  );
}

function isPdf(type = "", dataUrl = "", fileName = "") {
  return (
    type === "application/pdf" ||
    dataUrl.startsWith("data:application/pdf") ||
    /\.pdf$/i.test(fileName)
  );
}

function fileToDataURL(file) {
  return new Promise((resolve, reject) => {
    if (!file) {
      resolve("");
      return;
    }

    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(new Error("Failed to read file"));
    reader.readAsDataURL(file);
  });
}

async function filesToDataArray(files) {
  const arr = [];
  for (const file of files) {
    const dataUrl = await fileToDataURL(file);
    arr.push({
      name: file.name,
      type: file.type || "",
      size: file.size || 0,
      dataUrl
    });
  }
  return arr;
}

function downloadDataUrl(dataUrl, fileName = "download") {
  if (!dataUrl) {
    alert("No file available");
    return;
  }

  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = fileName || "download";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

function showPreview({ dataUrl = "", type = "", name = "" }) {
  if (!dataUrl) {
    alert("Preview not available");
    return;
  }

  previewBody.innerHTML = "";

  const title = document.createElement("div");
  title.className = "preview-file-name";
  title.textContent = name || "Preview";
  previewBody.appendChild(title);

  if (isImage(type, dataUrl, name)) {
    const img = document.createElement("img");
    img.src = dataUrl;
    img.alt = name || "Preview";
    previewBody.appendChild(img);
  } else if (isPdf(type, dataUrl, name)) {
    const embed = document.createElement("embed");
    embed.src = dataUrl;
    embed.type = "application/pdf";
    previewBody.appendChild(embed);
  } else {
    const p = document.createElement("p");
    p.style.color = "#ddd";
    p.style.textAlign = "center";
    p.textContent = "Preview not available for this file type. Please use download.";
    previewBody.appendChild(p);
  }

  previewModal.classList.remove("hidden");
}

function formatJoiningDate(dateValue) {
  if (!dateValue) return "N/A";

  try {
    if (typeof dateValue === "string") {
      const date = new Date(dateValue);
      if (!isNaN(date)) return date.toLocaleDateString("en-GB");
      return dateValue;
    }

    if (dateValue.seconds) {
      const date = new Date(dateValue.seconds * 1000);
      return date.toLocaleDateString("en-GB");
    }

    return "N/A";
  } catch {
    return "N/A";
  }
}

function getJoiningDateValue(emp) {
  return emp.joiningDate || emp.dateOfJoining || emp.joinDate || "";
}

function normalizeDateForCompare(value) {
  if (!value) return "";

  try {
    if (typeof value === "string") {
      const date = new Date(value);
      if (!isNaN(date)) {
        const yyyy = date.getFullYear();
        const mm = String(date.getMonth() + 1).padStart(2, "0");
        const dd = String(date.getDate()).padStart(2, "0");
        return `${yyyy}-${mm}-${dd}`;
      }

      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) return value;
      return "";
    }

    if (value.seconds) {
      const date = new Date(value.seconds * 1000);
      const yyyy = date.getFullYear();
      const mm = String(date.getMonth() + 1).padStart(2, "0");
      const dd = String(date.getDate()).padStart(2, "0");
      return `${yyyy}-${mm}-${dd}`;
    }

    return "";
  } catch {
    return "";
  }
}

function setEditMode(enabled) {
  editMode = enabled;

  const viewFields = document.querySelectorAll(".modal-field p");
  const editFields = document.querySelectorAll(".edit-input");

  viewFields.forEach(el => el.classList.toggle("hidden", enabled));
  editFields.forEach(el => el.classList.toggle("hidden", !enabled));

  if (editEmployeeBtn) editEmployeeBtn.classList.toggle("hidden", enabled);
  if (saveEmployeeBtn) saveEmployeeBtn.classList.toggle("hidden", !enabled);
  if (cancelEditBtn) cancelEditBtn.classList.toggle("hidden", !enabled);

  if (editPhotoWrap) editPhotoWrap.classList.toggle("hidden", !enabled);
  if (editIdProofWrap) editIdProofWrap.classList.toggle("hidden", !enabled);
  if (editDocumentsWrap) editDocumentsWrap.classList.toggle("hidden", !enabled);
}

function fillEditInputs(emp) {
  if (editFullName) editFullName.value = emp.fullName || "";
  if (editEmail) editEmail.value = emp.email || "";
  if (editMobile) editMobile.value = emp.mobile || "";
  if (editEmergency) editEmergency.value = emp.emergencyContact || "";
  if (editAddress) editAddress.value = emp.address || "";
  if (editDesignation) editDesignation.value = emp.designation || "";
  if (editExperience) editExperience.value = emp.experienceType || "Fresher";
  if (editOutlet) editOutlet.value = emp.outletName || "";
  if (editSalary) editSalary.value = emp.salary || "";
  if (editIdType) editIdType.value = emp.idType || "";
  if (editIdNumber) editIdNumber.value = emp.idNumber || "";
}

// =====================================================
// ID Proof render
// =====================================================
function renderIdProof(emp) {
  if (!idProofPreviewArea) return;
  idProofPreviewArea.innerHTML = `<p>No ID proof uploaded</p>`;
}

// =====================================================
// Other documents render
// =====================================================
function renderDocuments(emp) {
  if (!documentsGrid) return;
  documentsGrid.innerHTML = `<p class="no-docs-text">No documents uploaded</p>`;
}

// =====================================================
// Open employee modal
// =====================================================
function openEmployeeModal(emp) {
  currentEmployee = { ...emp };

  if (modalPhotoPreview) modalPhotoPreview.src = "../assets/logo.png";
  if (modalEmployeeTitle) modalEmployeeTitle.textContent = emp.fullName || "Employee Name";

  if (viewFullName) viewFullName.textContent = emp.fullName || "N/A";
  if (viewEmail) viewEmail.textContent = emp.email || "N/A";
  if (viewMobile) viewMobile.textContent = emp.mobile || "N/A";
  if (viewEmergency) viewEmergency.textContent = emp.emergencyContact || "N/A";
  if (viewAddress) viewAddress.textContent = emp.address || "N/A";
  if (viewDesignation) viewDesignation.textContent = emp.designation || "N/A";
  if (viewExperience) viewExperience.textContent = emp.experienceType || "N/A";
  if (viewOutlet) viewOutlet.textContent = emp.outletName || "N/A";
  if (viewSalary) viewSalary.textContent = emp.salary ? `₹ ${emp.salary}` : "N/A";
  if (viewIdType) viewIdType.textContent = emp.idType || "N/A";
  if (viewIdNumber) viewIdNumber.textContent = emp.idNumber || "N/A";

  fillEditInputs(emp);
  renderIdProof(emp);
  renderDocuments(emp);

  setEditMode(false);
  if (employeeModal) employeeModal.classList.remove("hidden");
}

// =====================================================
// Render employee table
// =====================================================
function renderEmployees(list) {
  if (!employeeTableBody) return;

  if (totalEmployees) totalEmployees.textContent = list.length;

  if (!list.length) {
    employeeTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-row">No employees found.</td>
      </tr>
    `;
    return;
  }

  employeeTableBody.innerHTML = "";

  list.forEach(emp => {
    const tr = document.createElement("tr");
    const joiningDate = formatJoiningDate(getJoiningDateValue(emp));

    tr.innerHTML = `
      <td>
        <img src="../assets/logo.png" alt="${emp.fullName || "Employee"}" class="employee-photo">
      </td>
      <td>
        <button class="employee-name-btn" type="button">${emp.fullName || "N/A"}</button>
      </td>
      <td>${emp.mobile || "N/A"}</td>
      <td>${emp.email || "N/A"}</td>
      <td>${emp.designation || "N/A"}</td>
      <td>${emp.outletName || "N/A"}</td>
      <td>${joiningDate}</td>
      <td>
        <button class="delete-btn" type="button">Delete</button>
      </td>
    `;

    tr.querySelector(".employee-name-btn").addEventListener("click", () => {
      openEmployeeModal(emp);
    });

    tr.querySelector(".delete-btn").addEventListener("click", async () => {
      const confirmDelete = confirm(`Delete ${emp.fullName || "this employee"}?`);
      if (!confirmDelete) return;

      try {
        await deleteDoc(doc(db, "employees", emp.docId));
        alert("Employee deleted successfully");
        await loadEmployees();
      } catch (error) {
        console.error("Delete error:", error);
        alert("Failed to delete employee: " + error.message);
      }
    });

    employeeTableBody.appendChild(tr);
  });
}

// =====================================================
// Filters
// =====================================================
function applyFilters() {
  const nameValue = searchName ? searchName.value.trim().toLowerCase() : "";
  const outletValue = searchOutlet ? searchOutlet.value.trim().toLowerCase() : "";
  const joiningFrom = searchJoiningDateFrom ? searchJoiningDateFrom.value : "";
  const joiningTo = searchJoiningDateTo ? searchJoiningDateTo.value : "";

  const filtered = employeesCache.filter(emp => {
    const fullName = (emp.fullName || "").toLowerCase();
    const outletName = (emp.outletName || "").toLowerCase();

    const joiningRaw = getJoiningDateValue(emp);
    const employeeDate = normalizeDateForCompare(joiningRaw);

    let fromMatch = true;
    let toMatch = true;

    if (joiningFrom) fromMatch = employeeDate && employeeDate >= joiningFrom;
    if (joiningTo) toMatch = employeeDate && employeeDate <= joiningTo;

    return (
      fullName.includes(nameValue) &&
      outletName.includes(outletValue) &&
      fromMatch &&
      toMatch
    );
  });

  renderEmployees(filtered);
}

// =====================================================
// Load employees
// =====================================================
async function loadEmployees() {
  if (!employeeTableBody) return;

  employeeTableBody.innerHTML = `
    <tr>
      <td colspan="8" class="empty-row">Loading employees...</td>
    </tr>
  `;

  try {
    const querySnapshot = await getDocs(collection(db, "employees"));

    employeesCache = [];
    querySnapshot.forEach((docSnap) => {
      employeesCache.push({
        docId: docSnap.id,
        ...docSnap.data()
      });
    });

    renderEmployees(employeesCache);
  } catch (error) {
    console.error("Error loading employees:", error);
    employeeTableBody.innerHTML = `
      <tr>
        <td colspan="8" class="empty-row">Failed to load employees.</td>
      </tr>
    `;
  }
}

// =====================================================
// Close modals
// =====================================================
if (closeModalBtn) {
  closeModalBtn.addEventListener("click", () => {
    if (employeeModal) employeeModal.classList.add("hidden");
    setEditMode(false);
  });
}

if (employeeModal) {
  employeeModal.addEventListener("click", (e) => {
    if (e.target === employeeModal) {
      employeeModal.classList.add("hidden");
      setEditMode(false);
    }
  });
}

if (closePreviewBtn) {
  closePreviewBtn.addEventListener("click", () => {
    if (previewModal) previewModal.classList.add("hidden");
    if (previewBody) previewBody.innerHTML = "";
  });
}

// =====================================================
// Save employee changes
// =====================================================
if (saveEmployeeBtn) {
  saveEmployeeBtn.addEventListener("click", async () => {
    if (!currentEmployee?.docId) return;

    saveEmployeeBtn.textContent = "Saving...";

    try {
      const updatedData = {
        fullName: editFullName ? editFullName.value.trim() : "",
        email: editEmail ? editEmail.value.trim() : "",
        mobile: editMobile ? editMobile.value.trim() : "",
        emergencyContact: editEmergency ? editEmergency.value.trim() : "",
        address: editAddress ? editAddress.value.trim() : "",
        designation: editDesignation ? editDesignation.value.trim() : "",
        experienceType: editExperience ? editExperience.value : "",
        outletName: editOutlet ? editOutlet.value.trim() : "",
        salary: editSalary ? Number(editSalary.value || 0) : 0,
        idType: editIdType ? editIdType.value : "",
        idNumber: editIdNumber ? editIdNumber.value.trim() : ""
      };

      await updateDoc(doc(db, "employees", currentEmployee.docId), updatedData);

      currentEmployee = { ...currentEmployee, ...updatedData };
      openEmployeeModal(currentEmployee);
      await loadEmployees();

      alert("Employee updated successfully!");
    } catch (error) {
      console.error("Error updating employee:", error);
      alert("Failed to update employee: " + error.message);
    } finally {
      saveEmployeeBtn.textContent = "Save Changes";
    }
  });
}

// =====================================================
// Search / Reset
// =====================================================
if (searchBtn) {
  searchBtn.addEventListener("click", applyFilters);
}

if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    if (searchName) searchName.value = "";
    if (searchOutlet) searchOutlet.value = "";
    if (searchJoiningDateFrom) searchJoiningDateFrom.value = "";
    if (searchJoiningDateTo) searchJoiningDateTo.value = "";
    renderEmployees(employeesCache);
  });
}

// =====================================================
// Init
// =====================================================
loadEmployees();