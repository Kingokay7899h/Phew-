<?php
session_start();
$conn = new mysqli("localhost", "root", "", "asset_management");
if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit;
}

if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], ['admin', 'lab_assistant', 'lab_faculty_in_charge', 'hod'])) {
    echo json_encode(["status" => "error", "message" => "Unauthorized"]);
    exit;
}

$data = json_decode(file_get_contents("php://input"), true);
if (!isset($data['form_id']) || !isset($data['items']) || empty($data['items'])) {
    echo json_encode(["status" => "error", "message" => "Missing required fields"]);
    exit;
}

$form_id = $data['form_id'];
$items = json_encode($data['items']);
$status = $data['status'];
$prepared_by_name = $data['prepared_by_name'] ?? '';
$prepared_by_designation = $data['prepared_by_designation'] ?? '';
$reviewed_by_name = $data['reviewed_by_name'] ?? '';
$reviewed_by_designation = $data['reviewed_by_designation'] ?? '';
$committee_member_2_name = $data['committee_member_2_name'] ?? '';
$committee_member_2_designation = $data['committee_member_2_designation'] ?? '';
$committee_member_3_designation = $data['committee_member_3_designation'] ?? '';
$committee_member_4_name = $data['committee_member_4_name'] ?? '';
$committee_member_5_name = $data['committee_member_5_name'] ?? '';

try {
    $conn->begin_transaction();

    // Check if form exists
    $sql = "SELECT form_id FROM disposal_forms WHERE form_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("s", $form_id);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result->num_rows > 0) {
        // Update existing form
        $sql = "UPDATE disposal_forms SET items = ?, status = ?, prepared_by_name = ?, prepared_by_designation = ?, reviewed_by_name = ?, reviewed_by_designation = ?, committee_member_2_name = ?, committee_member_2_designation = ?, committee_member_3_designation = ?, committee_member_4_name = ?, committee_member_5_name = ? WHERE form_id = ?";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssssssssssss", $items, $status, $prepared_by_name, $prepared_by_designation, $reviewed_by_name, $reviewed_by_designation, $committee_member_2_name, $committee_member_2_designation, $committee_member_3_designation, $committee_member_4_name, $committee_member_5_name, $form_id);
    } else {
        // Insert new form
        $sql = "INSERT INTO disposal_forms (form_id, items, status, prepared_by_name, prepared_by_designation, reviewed_by_name, reviewed_by_designation, committee_member_2_name, committee_member_2_designation, committee_member_3_designation, committee_member_4_name, committee_member_5_name) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)";
        $stmt = $conn->prepare($sql);
        $stmt->bind_param("ssssssssssss", $form_id, $items, $status, $prepared_by_name, $prepared_by_designation, $reviewed_by_name, $reviewed_by_designation, $committee_member_2_name, $committee_member_2_designation, $committee_member_3_designation, $committee_member_4_name, $committee_member_5_name);
    }
    $stmt->execute();
    $stmt->close();

    // Update register table for each item
    $sql = "UPDATE register SET reason_for_disposal = ?, disposal_status = ? WHERE sr_no = ?";
    $stmt = $conn->prepare($sql);
    foreach ($data['items'] as $item) {
        $reason = $item['reason'];
        $stmt->bind_param("sss", $reason, $status, $item['itemId']);
        $stmt->execute();
    }
    $stmt->close();

    $conn->commit();
    echo json_encode(["status" => "success", "message" => "Form saved successfully"]);
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(["status" => "error", "message" => "Error saving form: " . $e->getMessage()]);
}

$conn->close();
?>
