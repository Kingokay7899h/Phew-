<?php
session_start();
$conn = new mysqli("localhost", "root", "", "asset_management");
if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit;
}

if (!isset($_SESSION['role']) || !isset($_GET['form_id'])) {
    echo json_encode(["status" => "error", "message" => "Unauthorized or missing form_id"]);
    exit;
}

$form_id = $_GET['form_id'];
$sql = "SELECT * FROM disposal_forms WHERE form_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("s", $form_id);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    $row['items'] = json_decode($row['items'], true);
    echo json_encode(["status" => "success", "form" => $row]);
} else {
    echo json_encode(["status" => "error", "message" => "Form not found"]);
}

$stmt->close();
$conn->close();
?>
