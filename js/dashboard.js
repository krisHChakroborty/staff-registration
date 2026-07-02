import { auth, db } from "../firebase-config.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  collection,
  getDocs,
  doc,
  updateDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const logoutBtn = document.getElementById("logoutBtn");
const employeeTableBody = document.getElementById("employeeTableBody");
const totalEmployees = document.getElementById("totalEmployees");

const employeeModal = document.getElementById("employeeModal");
const closeModalBtn = document.getElementById("closeModalBtn");

const previewModal = document.getElementById("previewModal");
const closePreviewBtn = document.getElementById("closePreviewBtn");
const previewBody = document.getElementById("previewBody");

const editEmployeeBtn = document.getElementById("editEmployeeBtn");
const saveEmployeeBtn = document.getElementById("saveEmployeeBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

// profile view elements
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

// edit inputs
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

const editPhotoWrap = document.getElementById("editPhotoWrap");
const editIdProofWrap = document.getElementById("editIdProofWrap");
const editDocumentsWrap = document.getElementById("editDocumentsWrap");

const editPhotoInput = document.getElementById("editPhotoInput");
const editIdProofInput = document.getElementById("editIdProofInput");
const editDocumentsInput = document.getElementById("editDocumentsInput");

const idProofPreviewArea = document.getElementById("idProofPreviewArea");
const downloadIdProofBtn = document.getElementById("downloadIdProofBtn");
const documentsGrid = document.getElementById("documentsGrid");

let employeesCache = [];
let currentEmployee = null;
let editMode = false;

// ---------- Logout ----------
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

// ---------- Helpers ----------
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
    p.textContent = "Preview not available for this file type. Please use download.";
    previewBody.appendChild(p);
  }

  previewModal.classList.remove("hidden");
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
    previewBtn.textContent = isImage(fileObj.type, fileObj.dataUrl, fileObj.name) || isPdf(fileObj.type, fileObj.dataUrl, fileObj.name)
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

function openEmployeeModal(emp) {
  currentEmployee = { ...emp };

  // photo
  modalPhotoPreview.src = emp.photoData || "../logo.png";

  // view text
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

// ---------- Table load ----------
async function loadEmployees() {
  if (!employeeTableBody) return;

  employeeTableBody.innerHTML = `
    <tr>
      <td colspan="6" class="empty-row">Loading employees...</td>
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

    if (totalEmployees) totalEmployees.textContent = employeesCache.length;

    if (employeesCache.length === 0) {
      employeeTableBody.innerHTML = `
        <tr>
          <td colspan="6" class="empty-row">No employees found.</td>
        </tr>
      `;
      return;
    }

    employeeTableBody.innerHTML = "";

    employeesCache.forEach(emp => {
      const tr = document.createElement("tr");

      tr.innerHTML = `
        <td>
          <img src="${emp.photoData || "../logo.png"}" alt="${emp.fullName || "Employee"}" class="employee-photo">
        </td>
        <td>
          <button class="employee-name-btn">${emp.fullName || "N/A"}</button>
        </td>
        <td>${emp.mobile || "N/A"}</td>
        <td>${emp.email || "N/A"}</td>
        <td>${emp.designation || "N/A"}</td>
        <td>${emp.outletName || "N/A"}</td>
      `;

      tr.querySelector(".employee-name-btn").addEventListener("click", () => {
        openEmployeeModal(emp);
      });

      employeeTableBody.appendChild(tr);
    });
  } catch (error) {
    console.error("Error loading employees:", error);
    employeeTableBody.innerHTML = `
      <tr>
        <td colspan="6" class="empty-row">Failed to load employees.</td>
      </tr>
    `;
  }
}

// ---------- Close modals ----------
closeModalBtn.addEventListener("click", () => {
  employeeModal.classList.add("hidden");
  setEditMode(false);
});

employeeModal.addEventListener("click", (e) => {
  if (e.target === employeeModal) {
    employeeModal.classList.add("hidden");
    setEditMode(false);
  }
});

closePreviewBtn.addEventListener("click", () => {
  previewModal.classList.add("hidden");
  previewBody.innerHTML = "";
});

previewModal.addEventListener("click", (e) => {
  if (e.target === previewModal) {
    previewModal.classList.add("hidden");
    previewBody.innerHTML = "";
  }
});

// ---------- Photo buttons ----------
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

downloadPhotoBtn.addEventListener("click", () => {
  if (!currentEmployee?.photoData) {
    alert("No photo uploaded");
    return;
  }
  downloadDataUrl(currentEmployee.photoData, currentEmployee.photoName || "employee-photo");
});

downloadIdProofBtn.addEventListener("click", () => {
  if (!currentEmployee?.idProofData) {
    alert("No ID proof uploaded");
    return;
  }
  downloadDataUrl(currentEmployee.idProofData, currentEmployee.idProofName || "id-proof");
});

// ---------- Edit mode ----------
editEmployeeBtn.addEventListener("click", () => {
  if (!currentEmployee) return;
  fillEditInputs(currentEmployee);
  setEditMode(true);
});

cancelEditBtn.addEventListener("click", () => {
  if (!currentEmployee) return;
  fillEditInputs(currentEmployee);
  setEditMode(false);
});

// ---------- Save employee changes ----------
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

    // replace photo if selected
    if (editPhotoInput.files.length) {
      const photoFile = editPhotoInput.files[0];
      updatedData.photoName = photoFile.name;
      updatedData.photoType = photoFile.type || "";
      updatedData.photoData = await fileToDataURL(photoFile);
    }

    // replace ID proof if selected
    if (editIdProofInput.files.length) {
      const idProofFile = editIdProofInput.files[0];
      updatedData.idProofName = idProofFile.name;
      updatedData.idProofType = idProofFile.type || "";
      updatedData.idProofData = await fileToDataURL(idProofFile);
    }

    // replace documents if selected
    if (editDocumentsInput.files.length) {
      updatedData.documentNames = Array.from(editDocumentsInput.files).map(file => file.name);
      updatedData.documentsData = await filesToDataArray(Array.from(editDocumentsInput.files));
    }

    await updateDoc(doc(db, "employees", currentEmployee.docId), updatedData);

    // update local currentEmployee
    currentEmployee = {
      ...currentEmployee,
      ...updatedData
    };

    // clear file inputs after save
    editPhotoInput.value = "";
    editIdProofInput.value = "";
    editDocumentsInput.value = "";

    // refresh modal UI
    openEmployeeModal(currentEmployee);

    // refresh cache and table row list
    await loadEmployees();

    alert("Employee updated successfully!");
  } catch (error) {
    console.error("Error updating employee:", error);
    alert("Failed to update employee: " + error.message);
  } finally {
    saveEmployeeBtn.textContent = "Save Changes";
  }
});

loadEmployees();