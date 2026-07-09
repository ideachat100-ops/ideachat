<?php
// api/admin_actions.php
require_once 'db_connect.php';

header('Content-Type: application/json');

// Only allow POST requests for writing data
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    echo json_encode(['error' => 'Invalid request method']);
    exit;
}

$action = $_POST['action'] ?? '';

if ($action === 'add_portfolio') {
    $title = $_POST['title'] ?? '';
    $category = $_POST['category'] ?? '';
    $link = $_POST['link'] ?? '';
    
    // Handle file upload
    $imagePath = '';
    if (isset($_FILES['image']) && $_FILES['image']['error'] === UPLOAD_ERR_OK) {
        $uploadDir = '../images/portfolio/';
        if (!is_dir($uploadDir)) {
            mkdir($uploadDir, 0777, true);
        }
        $fileName = basename($_FILES['image']['name']);
        $targetFile = $uploadDir . time() . '_' . $fileName;
        
        if (move_uploaded_file($_FILES['image']['tmp_name'], $targetFile)) {
            $imagePath = 'images/portfolio/' . time() . '_' . $fileName;
        }
    } else {
        // Fallback to text input if they passed an image URL instead of file
        $imagePath = $_POST['imageUrl'] ?? '';
    }

    try {
        $stmt = $pdo->prepare("INSERT INTO portfolio (title, category, image, link) VALUES (?, ?, ?, ?)");
        if ($stmt->execute([$title, $category, $imagePath, $link])) {
            echo json_encode(['success' => true, 'message' => 'Portfolio item added successfully', 'id' => $pdo->lastInsertId()]);
        } else {
            echo json_encode(['error' => 'Failed to add portfolio item']);
        }
    } catch(PDOException $e) {
        echo json_encode(['error' => $e->getMessage()]);
    }
} else {
    echo json_encode(['error' => 'Unknown action']);
}
?>
