<?php
session_start();
$conn = new mysqli("localhost", "root", "", "asset_management");
if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit;
}

if (!isset($_SESSION['lab_id']) || !isset($_SESSION['role'])) {
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit;
}

$allowed_roles = ['admin', 'lab_assistant', 'lab_faculty_in_charge', 'hod'];
if (!in_array($_SESSION['role'], $allowed_roles)) {
    echo json_encode(["status" => "error", "message" => "Permission denied"]);
    exit;
}

$items = json_decode(file_get_contents("php://input"), true);
if (!is_array($items) || empty($items)) {
    echo json_encode(["status" => "error", "message" => "No items provided"]);
    exit;
}

$form_id = "FORM-" . time(); // Generate unique form ID
$lab_id = $_SESSION['lab_id'];
$status = "pending_stores";

try {
    $conn->begin_transaction();

    // Insert into disposal_forms
    $sql = "INSERT INTO disposal_forms (form_id, items, status) VALUES (?, ?, ?)";
    $stmt = $conn->prepare($sql);
    $items_json = json_encode($items); // Store items temporarily
    $stmt->bind_param("sss", $form_id, $items_json, $status);
    $stmt->execute();
    $stmt->close();

    // Update register table for each item
    $sql = "UPDATE register SET reason_for_disposal = ?, disposal_status = ? WHERE sr_no = ? AND lab_id = ?";
    $stmt = $conn->prepare($sql);
    foreach ($items as $item) {
        $reason = $item['reason_for_disposal'] ?? '';
        $stmt->bind_param("ssss", $reason, $status, $item['sr_no'], $lab_id);
        $stmt->execute();
    }
    $stmt->close();

    $conn->commit();
    echo json_encode(["status" => "success", "message" => "Disposal request submitted", "form_id" => $form_id]);
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(["status" => "error", "message" => "Error submitting request: " . $e->getMessage()]);
}

$conn->close();
?>
