<?php
session_start();
$conn = new mysqli("localhost", "root", "", "asset_management");
if ($conn->connect_error) {
    echo json_encode(["status" => "error", "message" => "Database connection failed"]);
    exit;
}

if (!isset($_SESSION['role']) || !in_array($_SESSION['role'], ['store', 'principal'])) {
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
$approval_date = $data['approval_date'] ?? null;
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

    $sql = "UPDATE disposal_forms SET items = ?, status = ?, approval_date = ?, prepared_by_name = ?, prepared_by_designation = ?, reviewed_by_name = ?, reviewed_by_designation = ?, committee_member_2_name = ?, committee_member_2_designation = ?, committee_member_3_designation = ?, committee_member_4_name = ?, committee_member_5_name = ? WHERE form_id = ?";
    $stmt = $conn->prepare($sql);
    $stmt->bind_param("sssssssssssss", $items, $status, $approval_date, $prepared_by_name, $prepared_by_designation, $reviewed_by_name, $reviewed_by_designation, $committee_member_2_name, $committee_member_2_designation, $committee_member_3_designation, $committee_member_4_name, $committee_member_5_name, $form_id);
    $stmt->execute();
    $stmt->close();

    $sql = "UPDATE register SET disposal_status = ? WHERE sr_no = ?";
    $stmt = $conn->prepare($sql);
    foreach ($data['items'] as $item) {
        $display_status = $status === "approved" ? "Approved by Committee on " . ($approval_date) : ($status === "pending_committee" ? "Pending Committee" : $status);
        $stmt->bind_param("ss", $display_status, $item['itemId']);
        $stmt->execute();
    }
    $stmt->close();

    $conn->commit();
    echo json_encode(["status" => "success", "message" => "Form updated successfully"]);
} catch (Exception $e) {
    $conn->rollback();
    echo json_encode(["status" => "error", "message" => "Error updating form: " . $e->getMessage()]);
}

$conn->close();
?>
