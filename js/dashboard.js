import { auth, db } from "../firebase-config.js";
import { signOut } from "https://www.gstatic.com/firebasejs/12.15.0/firebase-auth.js";
import {
  collection,
  getDocs,
  doc,
  deleteDoc
} from "https://www.gstatic.com/firebasejs/12.15.0/firebase-firestore.js";

/* ---------------- UI ELEMENTS ---------------- */
const logoutBtn = document.getElementById("logoutBtn");
const employeeTableBody = document.getElementById("employeeTableBody");
const totalEmployees = document.getElementById("totalEmployees");

const searchName = document.getElementById("searchName");
const searchOutlet = document.getElementById("searchOutlet");
const searchJoiningDateFrom = document.getElementById("searchJoiningDateFrom");
const searchJoiningDateTo = document.getElementById("searchJoiningDateTo");
const searchBtn = document.getElementById("searchBtn");
const resetBtn = document.getElementById("resetBtn");

/* ---------------- STATE ---------------- */
let employeesCache = [];

/* ---------------- LOGOUT ---------------- */
logoutBtn?.addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "login.html";
});

/* ---------------- DATE HELPERS ---------------- */
function getJoiningDate(emp) {
  return emp.joiningDate || emp.dateOfJoining || emp.joinDate || "";
}

function normalizeDate(value) {
  if (!value) return "";

  if (typeof value === "string") {
    const d = new Date(value);
    if (!isNaN(d)) {
      return d.toISOString().split("T")[0];
    }
    return value;
  }

  if (value?.seconds) {
    const d = new Date(value.seconds * 1000);
    return d.toISOString().split("T")[0];
  }

  return "";
}

/* ---------------- RENDER TABLE ---------------- */
function renderEmployees(list) {
  if (!employeeTableBody) return;

  totalEmployees.textContent = list.length;

  if (list.length === 0) {
    employeeTableBody.innerHTML = `
      <tr><td colspan="8" class="empty-row">No employees found</td></tr>
    `;
    return;
  }

  employeeTableBody.innerHTML = "";

  list.forEach(emp => {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td><img src="${emp.photoData || '../logo.png'}" class="employee-photo"></td>
      <td><button class="employee-name-btn">${emp.fullName || "N/A"}</button></td>
      <td>${emp.mobile || "N/A"}</td>
      <td>${emp.email || "N/A"}</td>
      <td>${emp.designation || "N/A"}</td>
      <td>${emp.outletName || "N/A"}</td>
      <td>${getJoiningDate(emp) || "N/A"}</td>
      <td><button class="delete-btn">Delete</button></td>
    `;

    /* delete */
    tr.querySelector(".delete-btn").addEventListener("click", async () => {
      if (!confirm("Delete employee?")) return;
      await deleteDoc(doc(db, "employees", emp.docId));
      loadEmployees();
    });

    employeeTableBody.appendChild(tr);
  });
}

/* ---------------- FILTER LOGIC (FIXED SEARCH) ---------------- */
function applyFilters() {
  const name = searchName.value.trim().toLowerCase();
  const outlet = searchOutlet.value.trim().toLowerCase();
  const from = searchJoiningDateFrom.value;
  const to = searchJoiningDateTo.value;

  const filtered = employeesCache.filter(emp => {
    const empName = (emp.fullName || "").toLowerCase();
    const empOutlet = (emp.outletName || "").toLowerCase();

    const empDate = normalizeDate(getJoiningDate(emp));

    let ok = true;

    if (name) ok = ok && empName.includes(name);
    if (outlet) ok = ok && empOutlet.includes(outlet);
    if (from) ok = ok && empDate >= from;
    if (to) ok = ok && empDate <= to;

    return ok;
  });

  renderEmployees(filtered);
}

/* ---------------- LOAD DATA ---------------- */
async function loadEmployees() {
  employeeTableBody.innerHTML =
    `<tr><td colspan="8">Loading...</td></tr>`;

  const snap = await getDocs(collection(db, "employees"));

  employeesCache = snap.docs.map(d => ({
    docId: d.id,
    ...d.data()
  }));

  renderEmployees(employeesCache);
}

/* ---------------- EVENTS FIX ---------------- */
searchBtn?.addEventListener("click", applyFilters);
resetBtn?.addEventListener("click", () => {
  searchName.value = "";
  searchOutlet.value = "";
  searchJoiningDateFrom.value = "";
  searchJoiningDateTo.value = "";
  renderEmployees(employeesCache);
});

/* ENTER KEY SEARCH */
searchName?.addEventListener("keydown", e => {
  if (e.key === "Enter") applyFilters();
});
searchOutlet?.addEventListener("keydown", e => {
  if (e.key === "Enter") applyFilters();
});

/* DATE CHANGE AUTO FILTER */
searchJoiningDateFrom?.addEventListener("change", applyFilters);
searchJoiningDateTo?.addEventListener("change", applyFilters);

/* INIT */
loadEmployees();