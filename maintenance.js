// Global variable to store selected items
let selectedItemsForDisposal = [];

document.addEventListener("DOMContentLoaded", function () {
  fetch("display_maintenance_table.php")
    .then(res => res.json())
    .then(data => populateTable("maintenanceBody", data, true))
    .catch(err => console.error("Error loading maintenance table:", err));

  // Initialize select all checkbox
  document.getElementById("selectAll").addEventListener("change", function () {
    const checkboxes = document.querySelectorAll("#maintenanceBody input[type='checkbox']");
    checkboxes.forEach(cb => cb.checked = this.checked);
    toggleDisposalButton();
  });

  // Handle Send Disposal Request button click
  document.getElementById("sendDisposalRequest").addEventListener("click", function () {
    selectedItemsForDisposal = getSelectedItems();
    if (selectedItemsForDisposal.length === 1) {
      // Single item: Show reason pop-up
      openDisposalReasonModal();
    } else if (selectedItemsForDisposal.length > 1) {
      // Multiple items: Open form directly
      openDisposalForm(null);
    }
  });

  // Handle Disposal Reason Form submission
  document.getElementById("disposalReasonForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const reason = document.getElementById("disposalReasonInput").value.trim();
    if (reason) {
      closeDisposalReasonModal();
      openDisposalForm(reason);
    } else {
      alert("Please enter a reason for disposal.");
    }
  });

  // Handle Edit Form submission
  document.getElementById("editForm").addEventListener("submit", function (e) {
    e.preventDefault();
    const srNo = document.getElementById("editSrNo").value;
    const lastMaintenance = document.getElementById("editLastMaintenance").value;
    const maintenanceDue = document.getElementById("editMaintenanceDue").value;
    const serviceProvider = document.getElementById("editServiceProvider").value;

    fetch("update_maintenance.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sr_no: srNo, last_maintenance: lastMaintenance, maintenance_due: maintenanceDue, service_provider: serviceProvider })
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          alert("Maintenance details updated successfully!");
          closeModal();
          window.location.reload();
        } else {
          alert("Error updating maintenance details: " + data.message);
        }
      })
      .catch(err => {
        console.error("Error updating maintenance:", err);
        alert("Error updating maintenance details.");
      });
  });
});

function populateTable(tbodyId, data, includeCheckbox) {
  const tbody = document.getElementById(tbodyId);
  tbody.innerHTML = "";
  data.forEach((row) => {
    const tr = document.createElement("tr");
    const today = new Date();
    const dueDate = new Date(row.maintenance_due);
    if (dueDate < today) {
      tr.style.backgroundColor = "#ffcccc";
    }

    if (includeCheckbox) {
      const checkboxTd = document.createElement("td");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.dataset.srNo = row.sr_no;
      checkbox.dataset.itemName = row.name_of_the_item;
      checkbox.addEventListener("change", toggleDisposalButton);
      checkboxTd.appendChild(checkbox);
      tr.appendChild(checkboxTd);
    }

    const columns = [row.sr_no, row.lab_id, row.name_of_the_item, row.date, row.last_maintenance, row.maintenance_due, row.service_provider];
    columns.forEach((val) => {
      const td = document.createElement("td");
      td.textContent = val || "-";
      tr.appendChild(td);
    });

    const actionTd = document.createElement("td");
    const btn = document.createElement("button");
    btn.textContent = "Edit";
    btn.onclick = () => openModal(row);
    actionTd.appendChild(btn);
    tr.appendChild(actionTd);

    tbody.appendChild(tr);
  });
}

function openModal(row) {
  document.getElementById("editSrNo").value = row.sr_no;
  document.getElementById("editLabId").value = row.lab_id;
  document.getElementById("editItemName").value = row.name_of_the_item;
  document.getElementById("editLastMaintenance").value = row.last_maintenance;
  document.getElementById("editMaintenanceDue").value = row.maintenance_due;
  document.getElementById("editServiceProvider").value = row.service_provider || "";
  document.getElementById("editModal").style.display = "block";
}

function closeModal() {
  document.getElementById("editModal").style.display = "none";
}

function openDisposalReasonModal() {
  document.getElementById("disposalReasonInput").value = "";
  document.getElementById("disposalReasonModal").style.display = "block";
}

function closeDisposalReasonModal() {
  document.getElementById("disposalReasonModal").style.display = "none";
}

function openDisposalForm(reason) {
  // Store selected items and reason in sessionStorage for disposal form
  sessionStorage.setItem("disposalItems", JSON.stringify(selectedItemsForDisposal));
  sessionStorage.setItem("disposalReason", reason || "");
  // Redirect to disposal form
  window.location.href = "disposal_form.html";
}

function getSelectedItems() {
  const checkboxes = document.querySelectorAll("#maintenanceBody input[type='checkbox']:checked");
  const selectedItems = [];
  checkboxes.forEach(cb => {
    selectedItems.push({
      sr_no: cb.dataset.srNo,
      name_of_the_item: cb.dataset.itemName
    });
  });
  return selectedItems;
}

function toggleDisposalButton() {
  const selectedItems = getSelectedItems();
  const disposalBtn = document.getElementById("sendDisposalRequest");
  // Check user role from session (set in PHP and passed to JS)
  const userRole = document.body.dataset.userRole || "";
  const allowedRoles = ["admin", "lab_assistant", "lab_faculty_in_charge", "hod"];
  disposalBtn.style.display = (selectedItems.length > 0 && allowedRoles.includes(userRole)) ? "inline-block" : "none";
} 
