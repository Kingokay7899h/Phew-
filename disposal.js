document.addEventListener("DOMContentLoaded", function () {
  // Load main disposal table
  fetch("display_disposal_table.php")
    .then(res => res.json())
    .then(data => populateTable("disposalBody", data, true))
    .catch(err => console.error("Error loading disposal table:", err));

  // Load past disposal table
  fetch("display_past_disposal_table.php")
    .then(res => res.json())
    .then(data => populateTable("pastDisposalBody", data, false))
    .catch(err => console.error("Error loading past disposal table:", err));

  // Load rejected disposal table
  fetch("display_rejected_disposal_table.php")
    .then(res => res.json())
    .then(data => populateTable("rejectedDisposalBody", data, false))
    .catch(err => console.error("Error loading rejected disposal table:", err));

  // Initialize select all checkbox for main disposal table
  document.getElementById("selectAll").addEventListener("change", function () {
    const checkboxes = document.querySelectorAll("#disposalBody input[type='checkbox']");
    checkboxes.forEach(cb => cb.checked = this.checked);
    toggleDisposeCompletelyButton();
  });

  // Handle Dispose Completely button
  document.getElementById("disposeCompletelyButton").addEventListener("click", function () {
    const selectedItems = getSelectedItems();
    const approvedItems = selectedItems.filter(item => item.disposal_status.startsWith("Approved by Committee"));
    if (approvedItems.length === 0) {
      alert("Please select items with status 'Approved by Committee'.");
      return;
    }

    fetch("dispose_completely.php", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(approvedItems)
    })
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          alert("Items disposed completely!");
          window.location.reload();
        } else {
          alert("Error disposing items: " + data.message);
        }
      })
      .catch(err => {
        console.error("Error disposing items:", err);
        alert("Error disposing items.");
      });
  });
});

function toggleSection(tableId) {
  const table = document.getElementById(tableId);
  table.style.display = table.style.display === "none" ? "table" : "none";
  const header = table.previousElementSibling;
  header.textContent = header.textContent.replace(table.style.display === "table" ? "▼" : "▲", table.style.display === "table" ? "▲" : "▼");
}

function populateTable(tbodyId, data, includeCheckbox) {
  const tbody = document.getElementById(tbodyId);
  tbody.innerHTML = "";
  data.forEach((row) => {
    const tr = document.createElement("tr");

    // Add checkbox for main disposal table only
    if (includeCheckbox) {
      const checkboxTd = document.createElement("td");
      const checkbox = document.createElement("input");
      checkbox.type = "checkbox";
      checkbox.dataset.srNo = row.sr_no;
      checkbox.dataset.itemName = row.name_of_the_item;
      checkbox.dataset.disposalStatus = row.disposal_status;
      checkbox.addEventListener("change", toggleDisposeCompletelyButton);
      checkboxTd.appendChild(checkbox);
      tr.appendChild(checkboxTd);
    }

    // Add visible columns
    const columns = [row.lab_id, row.name_of_the_item, row.date, row.reason_for_disposal, row.disposal_status];
    columns.forEach((val) => {
      const td = document.createElement("td");
      td.textContent = val || "-";
      tr.appendChild(td);
    });

    // Add View Form button
    const viewTd = document.createElement("td");
    const btn = document.createElement("button");
    btn.textContent = "View Form";
    btn.onclick = () => openModal(row);
    viewTd.appendChild(btn);
    tr.appendChild(viewTd);

    tbody.appendChild(tr);
  });
}

function toggleDisposeCompletelyButton() {
  const selectedItems = getSelectedItems();
  const disposeBtn = document.getElementById("disposeCompletelyButton");
  const userRole = document.body.dataset.userRole || "";
  const allowedRoles = ["admin", "lab_assistant", "lab_faculty_in_charge", "hod"];
  disposeBtn.style.display = (selectedItems.length > 0 && allowedRoles.includes(userRole)) ? "inline-block" : "none";
}

function getSelectedItems() {
  const checkboxes = document.querySelectorAll("#disposalBody input[type='checkbox']:checked");
  const selectedItems = [];
  checkboxes.forEach(cb => {
    selectedItems.push({
      sr_no: cb.dataset.srNo,
      name_of_the_item: cb.dataset.itemName,
      disposal_status: cb.dataset.disposalStatus
    });
  });
  return selectedItems;
}

function openModal(row) {
  sessionStorage.setItem("formId", row.form_id);
  window.location.href = "disposal_form.html";
}
