<?php
// api/get_portfolio.php
require_once 'db_connect.php';

header('Content-Type: application/json');

try {
    $stmt = $pdo->query("SELECT * FROM portfolio ORDER BY id DESC");
    $portfolio = $stmt->fetchAll();
    
    echo json_encode($portfolio);
} catch(PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
