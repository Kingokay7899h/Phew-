<?php
session_start();
$conn = new mysqli("localhost", "root", "", "asset_management");
if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit;
}

if (!isset($_SESSION['lab_id']) || !isset($_GET['sr_no'])) {
    echo json_encode(["status" => "error", "message" => "Unauthorized or missing sr_no"]);
    exit;
}

$sr_no = $_GET['sr_no'];
$lab_id = $_SESSION['lab_id'];

$sql = "SELECT sr_no, name_of_the_item, qty, price, date FROM register WHERE sr_no = ? AND lab_id = ?";
$stmt = $conn->prepare($sql);
$stmt->bind_param("ss", $sr_no, $lab_id);
$stmt->execute();
$result = $stmt->get_result();

if ($row = $result->fetch_assoc()) {
    echo json_encode(["status" => "success", "item" => $row]);
} else {
    echo json_encode(["status" => "error", "message" => "Item not found"]);
}

$stmt->close();
$conn->close();
?>
