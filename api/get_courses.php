<?php
// api/get_courses.php
require_once 'db_connect.php';

header('Content-Type: application/json');

try {
    $stmt = $pdo->query("SELECT * FROM courses");
    $courses = $stmt->fetchAll();
    
    $response = [];
    foreach ($courses as $course) {
        $course_id = $course['id'];
        
        // Fetch learnings
        $learnStmt = $pdo->prepare("SELECT learning_text FROM course_learnings WHERE course_id = ?");
        $learnStmt->execute([$course_id]);
        $learnings = $learnStmt->fetchAll(PDO::FETCH_COLUMN);
        
        // Fetch resources
        $resStmt = $pdo->prepare("SELECT * FROM course_resources WHERE course_id = ?");
        $resStmt->execute([$course_id]);
        $resources = $resStmt->fetchAll();
        
        $response[] = [
            'id' => $course['id'],
            'slug' => $course['slug'],
            'title' => $course['title'],
            'badge' => $course['badge'],
            'category' => $course['category'],
            'level' => $course['level'],
            'status' => $course['status'],
            'price' => $course['price'],
            'duration' => $course['duration'],
            'totalLessons' => (int)$course['total_lessons'],
            'rating' => (float)$course['rating'],
            'description' => $course['description'],
            'fullDescription' => $course['full_description'],
            'onlineOnly' => (bool)$course['online_only'],
            'coverImage' => $course['cover_image'],
            'introVideo' => $course['intro_video'],
            'pageUrl' => $course['page_url'],
            'instructor' => [
                'name' => $course['instructor_name'],
                'initials' => $course['instructor_initials'],
                'role' => $course['instructor_role']
            ],
            'whatYouLearn' => $learnings,
            'resources' => $resources,
            'bankPayment' => [
                'bankName' => $course['bank_name'],
                'accountNumber' => $course['account_number'],
                'ifsc' => $course['ifsc']
            ]
        ];
    }
    
    echo json_encode($response);
} catch(PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
