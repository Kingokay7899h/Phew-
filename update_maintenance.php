<?php
session_start();
$conn = new mysqli("localhost", "root", "", "asset_management");
if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit;
}

if (!isset($_SESSION['lab_id'])) {
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
$sr_no = $data['sr_no'] ?? '';
$last_maintenance = $data['last_maintenance'] ?? '';
$maintenance_due = $data['maintenance_due'] ?? '';
$service_provider = $data['service_provider'] ?? '';
$lab_id = $_SESSION['lab_id'];

if (!$sr_no || !$last_maintenance || !$maintenance_due) {
    echo json_encode(["status" => "error", "message" => "Missing required fields"]);
    exit;
}

$sql = "UPDATE register SET last_maintenance = ?, maintenance_due = ?, service_provider = ? WHERE sr_no = ? AND lab_id = ?";
$stmt = $conn->prepare($sql);
if (!$stmt) {
    echo json_encode(["status" => "error", "message" => "Query preparation failed"]);
    exit;
}

$stmt->bind_param("sssss", $last_maintenance, $maintenance_due, $service_provider, $sr_no, $lab_id);
if ($stmt->execute()) {
    echo json_encode(["status" => "success", "message" => "Maintenance updated successfully"]);
} else {
    echo json_encode(["status" => "error", "message" => "Error updating maintenance"]);
}

$stmt->close();
$conn->close();
?>
