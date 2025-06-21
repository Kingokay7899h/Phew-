document.addEventListener("DOMContentLoaded", function () {
  const items = JSON.parse(sessionStorage.getItem("disposalItems") || "[]");
  const reason = sessionStorage.getItem("disposalReason") || "";
  const userRole = document.body.dataset.userRole || "";
  const formId = sessionStorage.getItem("formId") || null;

  if (items.length === 0 && !formId) {
    alert("No items selected for disposal.");
    window.location.href = "maintenance.html";
    return;
  }

  loadFormData(items, reason, formId, userRole);

  document.getElementById("submitButton").addEventListener("click", handleSubmit);
  document.getElementById("approveButton").addEventListener("click", handleApprove);
  document.getElementById("rejectButton").addEventListener("click", openRejectReasonModal);
  document.getElementById("rejectReasonForm").addEventListener("submit", handleReject);
});

function loadFormData(items, reason, formId, userRole) {
  const tbody = document.getElementById("formItems");
  tbody.innerHTML = "";

  if (formId) {
    // Fetch existing form data
    fetch(`get_disposal_form.php?form_id=${formId}`)
      .then(res => res.json())
      .then(data => {
        if (data.status === "success") {
          populateForm(data.form, userRole);
        } else {
          alert("Error loading form: " + data.message);
          window.location.href = "maintenance.html";
        }
      })
      .catch(err => {
        console.error("Error fetching form:", err);
        alert("Error loading form.");
        window.location.href = "maintenance.html";
      });
  } else {
    // New form: Prefill with selected items
    items.forEach((item, index) => {
      fetch(`get_item_details.php?sr_no=${item.sr_no}`)
        .then(res => res.json())
        .then(data => {
          if (data.status === "success") {
            const row = createFormRow(index + 1, data.item, reason, item.sr_no);
            tbody.appendChild(row);
            autoResizeTextareas();
            updateFormState(userRole, "pending_stores");
          }
        });
    });
  }
}

function createFormRow(srNo, item, reason, itemId) {
  const tr = document.createElement("tr");
  tr.dataset.itemId = itemId;
  tr.innerHTML = `
    <td><textarea>${srNo}</textarea></td>
    <td><textarea>${item.name_of_the_item || ""}</textarea></td>
    <td><textarea>${item.qty || ""}</textarea></td>
    <td><textarea>${item.price || ""}</textarea></td>
    <td><input type="date" value="${item.date || ""}"></td>
    <td><input type="date"></td>
    <td><textarea></textarea></td>
    <td><textarea></textarea></td>
    <td><textarea></textarea></td>
    <td><textarea></textarea></td>
    <td><textarea>${reason || ""}</textarea></td>
    <td><textarea></textarea></td>
  `;
  return tr;
}

function populateForm(form, userRole) {
  const tbody = document.getElementById("formItems");
  form.items.forEach((item, index) => {
    const tr = document.createElement("tr");
    tr.dataset.itemId = item.itemId;
    tr.innerHTML = `
      <td><textarea>${item.srNo}</textarea></td>
      <td><textarea>${item.description}</textarea></td>
      <td><textarea>${item.quantity}</textarea></td>
      <td><textarea>${item.bookValue}</textarea></td>
      <td><input type="date" value="${item.purchaseDate}"></td>
      <td><input type="date" value="${item.unserviceableDate}"></td>
      <td><textarea>${item.periodOfUse}</textarea></td>
      <td><textarea>${item.condition}</textarea></td>
      <td><textarea>${item.repairEfforts}</textarea></td>
      <td><textarea>${item.location}</textarea></td>
      <td><textarea>${item.reason}</textarea></td>
      <td><textarea>${item.remarks}</textarea></td>
    `;
    tbody.appendChild(tr);
  });

  document.getElementById("preparedByName").value = form.prepared_by_name || "";
  document.getElementById("preparedByDesignation").value = form.prepared_by_designation || "";
  document.getElementById("reviewedByName").value = form.reviewed_by_name || "";
  document.getElementById("reviewedByDesignation").value = form.reviewed_by_designation || "";
  document.getElementById("committeeMember2Name").value = form.committee_member_2_name || "";
  document.getElementById("committeeMember2Designation").value = form.committee_member_2_designation || "";
  document.getElementById("committeeMember3Designation").value = form.committee_member_3_designation || "";
  document.getElementById("committeeMember4Name").value = form.committee_member_4_name || "";
  document.getElementById("committeeMember5Name").value = form.committee_member_5_name || "";

  autoResizeTextareas();
  updateFormState(userRole, form.status);
}

function autoResizeTextareas() {
  document.querySelectorAll("textarea").forEach(textarea => {
    textarea.addEventListener("input", function () {
      this.style.height = "auto";
      this.style.height = `${this.scrollHeight}px`;
    });
    textarea.dispatchEvent(new Event("input"));
  });
}

function updateFormState(userRole, status) {
  const inputs = document.querySelectorAll("input, textarea");
  const submitButton = document.getElementById("submitButton");
  const approveButton = document.getElementById("approveButton");
  const rejectButton = document.getElementById("rejectButton");

  if (status === "approved" || status === "rejected") {
    inputs.forEach(input => input.disabled = true);
    submitButton.style.display = "none";
    approveButton.style.display = "none";
    rejectButton.style.display = "none";
    return;
  }

  if (userRole === "store" && status === "pending_stores") {
    inputs.forEach(input => input.disabled = false);
    submitButton.style.display = "none";
    approveButton.style.display = "inline-block";
    rejectButton.style.display = "inline-block";
  } else if (userRole === "principal" && status === "pending_committee") {
    inputs.forEach(input => input.disabled = false);
    submitButton.style.display = "none";
    approveButton.style.display = "inline-block";
    rejectButton.style.display = "inline-block";
  } else if (["admin", "lab_assistant", "lab_faculty_in_charge", "hod"].includes(userRole) && status === "pending_stores") {
    inputs.forEach(input => input.disabled = false);
    submitButton.style.display = "inline-block";
    approveButton.style.display = "none";
    rejectButton.style.display = "none";
  } else {
    inputs.forEach(input => input.disabled = true);
    submitButton.style.display = "none";
    approveButton.style.display = "none";
    rejectButton.style.display = "none";
  }
}

function collectFormData() {
  const items = [];
  document.querySelectorAll("#formItems tr").forEach(row => {
    const item = {
      itemId: row.dataset.itemId,
      srNo: row.querySelector("td:nth-child(1) textarea").value,
      description: row.querySelector("td:nth-child(2) textarea").value,
      quantity: row.querySelector("td:nth-child(3) textarea").value,
      bookValue: row.querySelector("td:nth-child(4) textarea").value,
      purchaseDate: row.querySelector("td:nth-child(5) input").value,
      unserviceableDate: row.querySelector("td:nth-child(6) input").value,
      periodOfUse: row.querySelector("td:nth-child(7) textarea").value,
      condition: row.querySelector("td:nth-child(8) textarea").value,
      repairEfforts: row.querySelector("td:nth-child(9) textarea").value,
      location: row.querySelector("td:nth-child(10) textarea").value,
      reason: row.querySelector("td:nth-child(11) textarea").value,
      remarks: row.querySelector("td:nth-child(12) textarea").value
    };
    if (item.description || item.reason) items.push(item);
  });

  return {
    items,
    prepared_by_name: document.getElementById("preparedByName").value,
    prepared_by_designation: document.getElementById("preparedByDesignation").value,
    reviewed_by_name: document.getElementById("reviewedByName").value,
    reviewed_by_designation: document.getElementById("reviewedByDesignation").value,
    committee_member_2_name: document.getElementById("committeeMember2Name").value,
    committee_member_2_designation: document.getElementById("committeeMember2Designation").value,
    committee_member_3_designation: document.getElementById("committeeMember3Designation").value,
    committee_member_4_name: document.getElementById("committeeMember4Name").value,
    committee_member_5_name: document.getElementById("committeeMember5Name").value
  };
}

function handleSubmit(e) {
  e.preventDefault();
  const formData = collectFormData();
  if (formData.items.length === 0) {
    alert("Please fill at least one item.");
    return;
  }

  const formId = sessionStorage.getItem("formId") || "FORM-" + Date.now();
  sessionStorage.setItem("formId", formId);

  fetch("save_disposal_form.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ form_id: formId, ...formData, status: "pending_stores" })
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        alert("Form submitted successfully!");
        sessionStorage.removeItem("disposalItems");
        sessionStorage.removeItem("disposalReason");
        sessionStorage.removeItem("formId");
        window.location.href = "maintenance.html";
      } else {
        alert("Error submitting form: " + data.message);
      }
    })
    .catch(err => {
      console.error("Error submitting form:", err);
      alert("Error submitting form.");
    });
}

function handleApprove() {
  const formId = sessionStorage.getItem("formId");
  const formData = collectFormData();
  const userRole = document.body.dataset.userRole;
  const newStatus = userRole === "store" ? "pending_committee" : "approved";
  const approvalDate = userRole === "principal" ? new Date().toISOString().split("T")[0] : null;

  fetch("update_disposal_form.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ form_id: formId, ...formData, status: newStatus, approval_date: approvalDate })
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        alert("Form approved successfully!");
        sessionStorage.removeItem("formId");
        window.location.href = "disposal.html";
      } else {
        alert("Error approving form: " + data.message);
      }
    })
    .catch(err => {
      console.error("Error approving form:", err);
      alert("Error approving form.");
    });
}

function openRejectReasonModal() {
  document.getElementById("rejectReasonInput").value = "";
  document.getElementById("rejectReasonModal").style.display = "block";
}

function closeRejectReasonModal() {
  document.getElementById("rejectReasonModal").style.display = "none";
}

function handleReject(e) {
  e.preventDefault();
  const rejectionReason = document.getElementById("rejectReasonInput").value.trim();
  if (!rejectionReason) {
    alert("Please enter a reason for rejection.");
    return;
  }

  const formId = sessionStorage.getItem("formId");
  const formData = collectFormData();

  fetch("reject_disposal_form.php", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ form_id: formId, ...formData, status: "rejected", rejection_reason: rejectionReason })
  })
    .then(res => res.json())
    .then(data => {
      if (data.status === "success") {
        closeRejectReasonModal();
        alert("Form rejected successfully!");
        sessionStorage.removeItem("formId");
        window.location.href = "disposal.html";
      } else {
        alert("Error rejecting form: " + data.message);
      }
    })
    .catch(err => {
      console.error("Error rejecting form:", err);
      alert("Error rejecting form.");
    });
}
