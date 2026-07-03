import { auth, db } from "../firebase-config.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import {
  collection,
  getDocs,
  doc,
  updateDoc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// =========================
// Top section / table
// =========================
const logoutBtn = document.getElementById("logoutBtn");
const employeeTableBody = document.getElementById("employeeTableBody");
const totalEmployees = document.getElementById("totalEmployees");

// =========================
// Modal
// =========================
const employeeModal = document.getElementById("employeeModal");
const closeModalBtn = document.getElementById("closeModalBtn");
const modalEmployeeTitle = document.getElementById("modalEmployeeTitle");

// =========================
// Action buttons
// =========================
const editEmployeeBtn = document.getElementById("editEmployeeBtn");
const saveEmployeeBtn = document.getElementById("saveEmployeeBtn");
const cancelEditBtn = document.getElementById("cancelEditBtn");

// =========================
// Filters
// =========================
const searchName = document.getElementById("searchName");
const searchOutlet = document.getElementById("searchOutlet");
const searchBtn = document.getElementById("searchBtn");
const resetBtn = document.getElementById("resetBtn");

// =========================
// View fields
// =========================
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

// =========================
// Edit fields
// =========================
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

// =========================
// State
// =========================
let employeesCache = [];
let currentEmployee = null;
let editMode = false;

// =========================
// Logout
// =========================
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

// =========================
// Helpers
// =========================
function setEditMode(enabled) {
  editMode = enabled;

  const viewFields = document.querySelectorAll(".modal-field p");
  const editFields = document.querySelectorAll(".edit-input");

  viewFields.forEach(el => el.classList.toggle("hidden", enabled));
  editFields.forEach(el => el.classList.toggle("hidden", !enabled));

  editEmployeeBtn.classList.toggle("hidden", enabled);
  saveEmployeeBtn.classList.toggle("hidden", !enabled);
  cancelEditBtn.classList.toggle("hidden", !enabled);
}

function fillEditInputs(emp) {
  editFullName.value = emp.fullName || "";
  editEmail.value = emp.email || "";
  editMobile.value = emp.mobile || "";
  editEmergency.value = emp.emergencyContact || "";
  editAddress.value = emp.address || "";
  editDesignation.value = emp.designation || "";
  editExperience.value = emp.experienceType || "";
  editOutlet.value = emp.outletName || "";
  editSalary.value = emp.salary || "";
  editIdType.value = emp.idType || "";
  editIdNumber.value = emp.idNumber || "";
}

function openEmployeeModal(emp) {
  currentEmployee = { ...emp };

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
  setEditMode(false);
  employeeModal.classList.remove("hidden");
}

function renderEmployees(list) {
  if (!employeeTableBody) return;

  totalEmployees.textContent = list.length;

  if (!list.length) {
    employeeTableBody.innerHTML = `
      <tr>
        <td colspan="7" class="empty-row">No employees found.</td>
      </tr>
    `;
    return;
  }

  employeeTableBody.innerHTML = "";

  list.forEach(emp => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>
        <button class="employee-name-btn" type="button">${emp.fullName || "N/A"}</button>
      </td>
      <td>${emp.mobile || "N/A"}</td>
      <td>${emp.email || "N/A"}</td>
      <td>${emp.designation || "N/A"}</td>
      <td>${emp.experienceType || "N/A"}</td>
      <td>${emp.outletName || "N/A"}</td>
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

function applyFilters() {
  const nameValue = searchName.value.trim().toLowerCase();
  const outletValue = searchOutlet.value.trim().toLowerCase();

  const filtered = employeesCache.filter(emp => {
    const fullName = (emp.fullName || "").toLowerCase();
    const outletName = (emp.outletName || "").toLowerCase();

    return fullName.includes(nameValue) && outletName.includes(outletValue);
  });

  renderEmployees(filtered);
}

// =========================
// Load employees
// =========================
async function loadEmployees() {
  employeeTableBody.innerHTML = `
    <tr>
      <td colspan="7" class="empty-row">Loading employees...</td>
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
        <td colspan="7" class="empty-row">Failed to load employees.</td>
      </tr>
    `;
  }
}

// =========================
// Modal close
// =========================
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

// =========================
// Edit buttons
// =========================
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
    setEditMode(false);
  });
}

// =========================
// Save employee changes
// =========================
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

      await updateDoc(doc(db, "employees", currentEmployee.docId), updatedData);

      currentEmployee = {
        ...currentEmployee,
        ...updatedData
      };

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

// =========================
// Search / Reset
// =========================
if (searchBtn) {
  searchBtn.addEventListener("click", applyFilters);
}

if (resetBtn) {
  resetBtn.addEventListener("click", () => {
    searchName.value = "";
    searchOutlet.value = "";
    renderEmployees(employeesCache);
  });
}

if (searchName) {
  searchName.addEventListener("keydown", (e) => {
    if (e.key === "Enter") applyFilters();
  });
}

if (searchOutlet) {
  searchOutlet.addEventListener("keydown", (e) => {
    if (e.key === "Enter") applyFilters();
  });
}

// =========================
// Init
// =========================
loadEmployees();