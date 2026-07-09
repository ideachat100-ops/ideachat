CREATE DATABASE IF NOT EXISTS ideachat;
USE ideachat;

CREATE TABLE IF NOT EXISTS site_settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    site_name VARCHAR(255) NOT NULL,
    tagline VARCHAR(255),
    description TEXT,
    copyright VARCHAR(255),
    whatsapp VARCHAR(20),
    email VARCHAR(100),
    location VARCHAR(255),
    facebook VARCHAR(255),
    twitter VARCHAR(255),
    instagram VARCHAR(255),
    linkedin VARCHAR(255)
);

INSERT INTO site_settings (site_name, tagline, description, copyright, whatsapp, facebook, twitter, instagram, linkedin)
VALUES (
    'IdeaChat', 
    'Branding, Web & Design Academy', 
    'We design professional graphics, build elegant custom websites, and provide industry-standard learning programs through our structured Graphic Design Academy.',
    '© 2026 IdeaChat. All Rights Reserved.',
    '+94788009907',
    '#', '#', '#', '#'
) ON DUPLICATE KEY UPDATE id=id;

CREATE TABLE IF NOT EXISTS courses (
    id VARCHAR(50) PRIMARY KEY,
    slug VARCHAR(100) NOT NULL,
    title VARCHAR(255) NOT NULL,
    badge VARCHAR(100),
    category VARCHAR(100),
    level VARCHAR(50),
    status VARCHAR(50) DEFAULT 'active',
    price VARCHAR(50),
    duration VARCHAR(50),
    total_lessons INT,
    rating FLOAT,
    description TEXT,
    full_description TEXT,
    online_only BOOLEAN DEFAULT 1,
    cover_image VARCHAR(255),
    intro_video VARCHAR(255),
    page_url VARCHAR(255),
    instructor_name VARCHAR(100),
    instructor_initials VARCHAR(10),
    instructor_role VARCHAR(100),
    bank_name VARCHAR(100),
    account_number VARCHAR(100),
    ifsc VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS course_learnings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id VARCHAR(50),
    learning_text TEXT,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS course_resources (
    id VARCHAR(50) PRIMARY KEY,
    course_id VARCHAR(50),
    title VARCHAR(255),
    type VARCHAR(20),
    size VARCHAR(20),
    file_url VARCHAR(255),
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS portfolio (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    category VARCHAR(100),
    image VARCHAR(255),
    link VARCHAR(255)
);

CREATE TABLE IF NOT EXISTS services (
    id VARCHAR(50) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50)
);

CREATE TABLE IF NOT EXISTS enrollments (
    id INT AUTO_INCREMENT PRIMARY KEY,
    course_id VARCHAR(50),
    student_name VARCHAR(255),
    student_email VARCHAR(255),
    student_phone VARCHAR(20),
    payment_receipt VARCHAR(255),
    status VARCHAR(50) DEFAULT 'pending', -- pending, approved, rejected
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE CASCADE
);

-- Insert initial sample data
INSERT INTO courses (id, slug, title, badge, category, level, price, duration, total_lessons, rating, description, full_description, cover_image, instructor_name, instructor_initials, instructor_role, bank_name, account_number, ifsc)
VALUES 
('photoshop-illustrator', 'photoshop-course', 'Adobe Photoshop & Illustrator Mastery', 'Beginner to Advanced', 'Software Mastery', 'beginner-to-advanced', 'Rs 12,000', '8 Weeks', 32, 4.9, 'Master basic visual manipulation layers, vector drawings, custom logo drafting, and printing layout export presets.', 'This class takes you step-by-step from layout zero to Adobe tool hero.', 'images/academy/photoshop.jpg', 'John Doe', 'JD', 'Lead Graphic Instructor', 'ABC Bank', '123-456-789', 'ABCD0123456') ON DUPLICATE KEY UPDATE id=id;

INSERT INTO course_learnings (course_id, learning_text) VALUES 
('photoshop-illustrator', 'Photoshop adjustments: hue, saturation, lighting layers, and curves.'),
('photoshop-illustrator', 'Illustrator tools: pen tool mastery, node anchors, bezier curves, and pathfinders.'),
('photoshop-illustrator', 'Layout rules: alignment guidelines, safe margins, and grid frameworks.'),
('photoshop-illustrator', 'Production handoff: print bleed setups, CYMK vs RGB, and SVG assets generation.');
