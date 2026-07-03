import { auth, db } from "../firebase-config.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

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

  viewFields.forEach(el => {
    el.classList.toggle("hidden", enabled);
  });

  editFields.forEach(el => {
    el.classList.toggle("hidden", !enabled);
  });

  editEmployeeBtn.classList.toggle("hidden", enabled);
  saveEmployeeBtn.classList.toggle("hidden", !enabled);
  cancelEditBtn.classList.toggle("hidden", !enabled);

  editPhotoWrap.classList.toggle("hidden", !enabled);
  editIdProofWrap.classList.toggle("hidden", !enabled);
  editDocumentsWrap.classList.toggle("hidden", !enabled);
}

function fillEditInputs(emp) {
  editFullName.value = emp.fullName || "";
  editEmail.value = emp.email || "";
  editMobile.value = emp.mobile || "";
  editEmergency.value = emp.emergencyContact || "";
  editAddress.value = emp.address || "";
  editDesignation.value = emp.designation || "";
  editExperience.value = emp.experienceType || "Fresher";
  editOutlet.value = emp.outletName || "";
  editSalary.value = emp.salary || "";
  editIdType.value = emp.idType || "Aadhaar Card";
  editIdNumber.value = emp.idNumber || "";
}

// =====================================================
// ID Proof render
// =====================================================
function renderIdProof(emp) {
  idProofPreviewArea.innerHTML = "";

  if (!emp.idProofData) {
    idProofPreviewArea.innerHTML = `<p>No ID proof uploaded</p>`;
    return;
  }

  if (isImage(emp.idProofType, emp.idProofData, emp.idProofName)) {
    const img = document.createElement("img");
    img.src = emp.idProofData;
    img.alt = emp.idProofName || "ID Proof";
    img.addEventListener("click", () => {
      showPreview({
        dataUrl: emp.idProofData,
        type: emp.idProofType,
        name: emp.idProofName
      });
    });

    const name = document.createElement("p");
    name.textContent = emp.idProofName || "ID Proof";

    const actions = document.createElement("div");
    actions.className = "doc-actions";

    const zoomBtn = document.createElement("button");
    zoomBtn.className = "small-btn";
    zoomBtn.textContent = "Zoom";
    zoomBtn.type = "button";
    zoomBtn.addEventListener("click", () => {
      showPreview({
        dataUrl: emp.idProofData,
        type: emp.idProofType,
        name: emp.idProofName
      });
    });

    const downloadBtn = document.createElement("button");
    downloadBtn.className = "small-btn";
    downloadBtn.textContent = "Download";
    downloadBtn.type = "button";
    downloadBtn.addEventListener("click", () => {
      downloadDataUrl(emp.idProofData, emp.idProofName || "id-proof");
    });

    actions.appendChild(zoomBtn);
    actions.appendChild(downloadBtn);

    idProofPreviewArea.appendChild(img);
    idProofPreviewArea.appendChild(name);
    idProofPreviewArea.appendChild(actions);
  } else if (isPdf(emp.idProofType, emp.idProofData, emp.idProofName)) {
    const name = document.createElement("p");
    name.textContent = emp.idProofName || "ID Proof PDF";

    const actions = document.createElement("div");
    actions.className = "doc-actions";

    const previewBtn = document.createElement("button");
    previewBtn.className = "small-btn";
    previewBtn.textContent = "Preview";
    previewBtn.type = "button";
    previewBtn.addEventListener("click", () => {
      showPreview({
        dataUrl: emp.idProofData,
        type: emp.idProofType,
        name: emp.idProofName
      });
    });

    const downloadBtn = document.createElement("button");
    downloadBtn.className = "small-btn";
    downloadBtn.textContent = "Download";
    downloadBtn.type = "button";
    downloadBtn.addEventListener("click", () => {
      downloadDataUrl(emp.idProofData, emp.idProofName || "id-proof.pdf");
    });

    actions.appendChild(previewBtn);
    actions.appendChild(downloadBtn);

    idProofPreviewArea.appendChild(name);
    idProofPreviewArea.appendChild(actions);
  } else {
    idProofPreviewArea.innerHTML = `<p>${emp.idProofName || "File uploaded"}</p>`;
  }
}

// =====================================================
// Other documents render
// =====================================================
function renderDocuments(emp) {
  documentsGrid.innerHTML = "";

  if (!emp.documentsData || !Array.isArray(emp.documentsData) || emp.documentsData.length === 0) {
    documentsGrid.innerHTML = `<p class="no-docs-text">No documents uploaded</p>`;
    return;
  }

  emp.documentsData.forEach((fileObj, index) => {
    const card = document.createElement("div");
    card.className = "doc-card";

    if (isImage(fileObj.type, fileObj.dataUrl, fileObj.name)) {
      const img = document.createElement("img");
      img.src = fileObj.dataUrl;
      img.alt = fileObj.name || "Document";
      img.addEventListener("click", () => {
        showPreview({
          dataUrl: fileObj.dataUrl,
          type: fileObj.type,
          name: fileObj.name
        });
      });
      card.appendChild(img);
    }

    const name = document.createElement("div");
    name.className = "doc-name";
    name.textContent = fileObj.name || `Document ${index + 1}`;
    card.appendChild(name);

    const actions = document.createElement("div");
    actions.className = "doc-actions";

    const previewBtn = document.createElement("button");
    previewBtn.className = "small-btn";
    previewBtn.type = "button";
    previewBtn.textContent =
      isImage(fileObj.type, fileObj.dataUrl, fileObj.name) ||
      isPdf(fileObj.type, fileObj.dataUrl, fileObj.name)
        ? "Preview"
        : "Open";

    previewBtn.addEventListener("click", () => {
      showPreview({
        dataUrl: fileObj.dataUrl,
        type: fileObj.type,
        name: fileObj.name
      });
    });

    const downloadBtn = document.createElement("button");
    downloadBtn.className = "small-btn";
    downloadBtn.type = "button";
    downloadBtn.textContent = "Download";
    downloadBtn.addEventListener("click", () => {
      downloadDataUrl(fileObj.dataUrl, fileObj.name || "document");
    });

    actions.appendChild(previewBtn);
    actions.appendChild(downloadBtn);
    card.appendChild(actions);

    documentsGrid.appendChild(card);
  });
}

// =====================================================
// Open employee modal
// =====================================================
function openEmployeeModal(emp) {
  currentEmployee = { ...emp };

  modalPhotoPreview.src = emp.photoData || "../logo.png";
  modalEmployeeTitle.textContent = emp.fullName || "Employee Name";

  viewFullName.textContent = emp.fullName || "N/A";
  viewEmail.textContent = emp.email || "N/A";
  viewMobile.textContent = emp.mobile || "N/A";
  viewEmergency.textContent = emp.emergencyContact || "N/A";
  viewAddress.textContent = emp.address || "N/A";
  viewDesignation.textContent = emp.designation || "N/A";
  viewExperience.textContent = emp.experienceType || "N/A";
  viewOutlet.textContent = emp.outletName || "N/A";
  viewSalary.textContent = emp.salary ? `₹ ${emp.salary}` : "N/A";
  viewIdType.textContent = emp.idType || "N/A";
  viewIdNumber.textContent = emp.idNumber || "N/A";

  fillEditInputs(emp);
  renderIdProof(emp);
  renderDocuments(emp);

  setEditMode(false);
  employeeModal.classList.remove("hidden");
}

// =====================================================
// Render employee table
// =====================================================
function renderEmployees(list) {
  if (!employeeTableBody) return;

  if (totalEmployees) {
    totalEmployees.textContent = list.length;
  }

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
        <img src="${emp.photoData || "../logo.png"}" alt="${emp.fullName || "Employee"}" class="employee-photo">
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
  const nameValue = searchName.value.trim().toLowerCase();
  const outletValue = searchOutlet.value.trim().toLowerCase();
  const joiningFrom = searchJoiningDateFrom.value;
  const joiningTo = searchJoiningDateTo.value;

  const filtered = employeesCache.filter(emp => {
    const fullName = (emp.fullName || "").toLowerCase();
    const outletName = (emp.outletName || "").toLowerCase();

    const joiningRaw = getJoiningDateValue(emp);
    const employeeDate = normalizeDateForCompare(joiningRaw);

    let fromMatch = true;
    let toMatch = true;

    if (joiningFrom) {
      fromMatch = employeeDate && employeeDate >= joiningFrom;
    }

    if (joiningTo) {
      toMatch = employeeDate && employeeDate <= joiningTo;
    }

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
    employeeModal.classList.add("hidden");
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
    previewModal.classList.add("hidden");
    previewBody.innerHTML = "";
  });
}

if (previewModal) {
  previewModal.addEventListener("click", (e) => {
    if (e.target === previewModal) {
      previewModal.classList.add("hidden");
      previewBody.innerHTML = "";
    }
  });
}

// =====================================================
// Photo buttons
// =====================================================
if (zoomPhotoBtn) {
  zoomPhotoBtn.addEventListener("click", () => {
    if (!currentEmployee?.photoData) {
      alert("No photo uploaded");
      return;
    }

    showPreview({
      dataUrl: currentEmployee.photoData,
      type: currentEmployee.photoType,
      name: currentEmployee.photoName || "Employee Photo"
    });
  });
}

if (downloadPhotoBtn) {
  downloadPhotoBtn.addEventListener("click", () => {
    if (!currentEmployee?.photoData) {
      alert("No photo uploaded");
      return;
    }

    downloadDataUrl(
      currentEmployee.photoData,
      currentEmployee.photoName || "employee-photo"
    );
  });
}

if (downloadIdProofBtn) {
  downloadIdProofBtn.addEventListener("click", () => {
    if (!currentEmployee?.idProofData) {
      alert("No ID proof uploaded");
      return;
    }

    downloadDataUrl(
      currentEmployee.idProofData,
      currentEmployee.idProofName || "id-proof"
    );
  });
}

// =====================================================
// Edit mode buttons
// =====================================================
if (editEmployeeBtn) {
  editEmployeeBtn.addEventListener("click", () => {
    if (!currentEmployee) return;
    fillEditInputs(currentEmployee);
    setEditMode(true);
  });
}

if (cancelEditBtn) {
  cancelEditBtn.addEventListener("click", () => {
    if (!currentEmployee) return;

    fillEditInputs(currentEmployee);
    editPhotoInput.value = "";
    editIdProofInput.value = "";
    editDocumentsInput.value = "";
    setEditMode(false);
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
        fullName: editFullName.value.trim(),
        email: editEmail.value.trim(),
        mobile: editMobile.value.trim(),
        emergencyContact: editEmergency.value.trim(),
        address: editAddress.value.trim(),
        designation: editDesignation.value.trim(),
        experienceType: editExperience.value,
        outletName: editOutlet.value.trim(),
        salary: Number(editSalary.value || 0),
        idType: editIdType.value,
        idNumber: editIdNumber.value.trim()
      };

      if (editPhotoInput.files.length) {
        const photoFile = editPhotoInput.files[0];
        updatedData.photoName = photoFile.name;
        updatedData.photoType = photoFile.type || "";
        updatedData.photoData = await fileToDataURL(photoFile);
      }

      if (editIdProofInput.files.length) {
        const idProofFile = editIdProofInput.files[0];
        updatedData.idProofName = idProofFile.name;
        updatedData.idProofType = idProofFile.type || "";
        updatedData.idProofData = await fileToDataURL(idProofFile);
      }

      if (editDocumentsInput.files.length) {
        updatedData.documentNames = Array.from(editDocumentsInput.files).map(file => file.name);
        updatedData.documentsData = await filesToDataArray(Array.from(editDocumentsInput.files));
      }

      await updateDoc(doc(db, "employees", currentEmployee.docId), updatedData);

      currentEmployee = {
        ...currentEmployee,
        ...updatedData
      };

      editPhotoInput.value = "";
      editIdProofInput.value = "";
      editDocumentsInput.value = "";

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
    searchName.value = "";
    searchOutlet.value = "";
    searchJoiningDateFrom.value = "";
    searchJoiningDateTo.value = "";
    renderEmployees(employeesCache);
  });
}

// Optional: Enter key on filters
[searchName, searchOutlet].forEach(input => {
  if (!input) return;
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      applyFilters();
    }
  });
});

[searchJoiningDateFrom, searchJoiningDateTo].forEach(input => {
  if (!input) return;
  input.addEventListener("change", applyFilters);
});

// =====================================================
// Init
// =====================================================
loadEmployees();