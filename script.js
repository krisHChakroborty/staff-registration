console.log("FirstWave Fries HRMS Loaded");

import { db } from "./firebase-config.js";
import {
    collection,
    getDocs,
    deleteDoc,
    doc
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

const table = document.getElementById("employeeTable");
const totalEmployees = document.getElementById("totalEmployees");

// Load Employees
async function loadEmployees() {
    table.innerHTML = "";

    const snapshot = await getDocs(collection(db, "employees"));

    totalEmployees.innerText = snapshot.size;

    snapshot.forEach((docItem) => {
        const emp = docItem.data();

        table.innerHTML += `
            <tr>
                <td>${emp.name}</td>
                <td>${emp.employeeId}</td>
                <td>${emp.mobile}</td>
                <td>${emp.email}</td>
                <td>${emp.designation}</td>
                <td>
                    <button onclick="deleteEmployee('${docItem.id}')">Delete</button>
                </td>
            </tr>
        `;
    });
}

// Delete
window.deleteEmployee = async function(id) {
    await deleteDoc(doc(db, "employees", id));
    alert("Deleted ✔️");
    loadEmployees();
};

loadEmployees();