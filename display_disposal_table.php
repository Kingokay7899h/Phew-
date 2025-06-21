<?php
session_start();
$conn = new mysqli("localhost", "root", "", "asset_management");
if ($conn->connect_error) {
    echo json_encode(["error" => "Database connection failed"]);
    exit;
}

if (!isset($_SESSION['role'])) {
    echo json_encode(["error" => "Unauthorized"]);
    exit;
}

$role = $_SESSION['role'];
$lab_id = $_SESSION['lab_id'] ?? null;

$sql = "SELECT r.sr_no, r.lab_id, r.name_of_the_item, r.date, r.reason_for_disposal, r.disposal_status, df.form_id 
        FROM register r
        LEFT JOIN disposal_forms df ON JSON_CONTAINS(df.items, JSON_QUOTE(r.sr_no), '$.items[*].itemId')
        WHERE r.disposal_status LIKE 'Pending%'";
if (in_array($role, ['lab_assistant', 'lab_faculty_in_charge']) && $lab_id) {
    $sql .= " AND r.lab_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $lab_id);
} else {
    $stmt = $conn->prepare($sql);
}

$stmt->execute();
$result = $stmt->get_result();

$data = [];
while ($row = $result->fetch_assoc()) {
    $data[] = $row;
}
echo json_encode($data);
$stmt->close();
$conn->close();
?>
