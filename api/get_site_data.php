<?php
// api/get_site_data.php
require_once 'db_connect.php';

header('Content-Type: application/json');

try {
    $stmt = $pdo->query("SELECT * FROM site_settings LIMIT 1");
    $site_data = $stmt->fetch();
    
    if($site_data) {
        // Format as expected by frontend
        $response = [
            'name' => $site_data['site_name'],
            'tagline' => $site_data['tagline'],
            'description' => $site_data['description'],
            'copyright' => $site_data['copyright'],
            'contact' => [
                'whatsapp' => $site_data['whatsapp'],
                'email' => $site_data['email'],
                'location' => $site_data['location']
            ],
            'socialLinks' => [
                'facebook' => $site_data['facebook'],
                'twitter' => $site_data['twitter'],
                'instagram' => $site_data['instagram'],
                'linkedin' => $site_data['linkedin']
            ],
            'navigation' => [
                [ "label" => "Home",      "href" => "index.html" ],
                [ "label" => "About",     "href" => "about.html" ],
                [ "label" => "Academy",   "href" => "academy.html" ],
                [ "label" => "Services",  "href" => "services.html" ],
                [ "label" => "Portfolio", "href" => "portfolio.html" ],
                [ "label" => "Contact",   "href" => "contact.html" ]
            ]
        ];
        echo json_encode($response);
    } else {
        echo json_encode(['error' => 'No site data found']);
    }
} catch(PDOException $e) {
    echo json_encode(['error' => $e->getMessage()]);
}
?>
