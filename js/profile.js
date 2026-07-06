/**
 * Student Profile Page Script
 * Loads the stored Academy profile and displays it.
 */

const STUDENT_STORAGE_KEY = 'academyStudentProfile';

const getStoredStudent = () => {
  try {
    return JSON.parse(localStorage.getItem(STUDENT_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
};

const showProfile = (student) => {
  const profileInfo = document.getElementById('profileInfo');
  const profileEmpty = document.getElementById('profileEmpty');
  const profileEmail = document.getElementById('profileEmail');
  const profilePhone = document.getElementById('profilePhone');
  const profileCourse = document.getElementById('profileCourse');
  const profileCreated = document.getElementById('profileCreated');

  if (!student || !profileInfo || !profileEmpty || !profileEmail || !profilePhone || !profileCourse || !profileCreated) {
    return;
  }

  profileEmail.textContent = student.email;
  profilePhone.textContent = student.phone;
  profileCourse.textContent = student.course;
  profileCreated.textContent = new Date(student.createdAt).toLocaleDateString();

  profileInfo.style.display = 'grid';
  profileEmpty.style.display = 'none';
};

const showEmptyProfile = () => {
  const profileInfo = document.getElementById('profileInfo');
  const profileEmpty = document.getElementById('profileEmpty');

  if (profileInfo && profileEmpty) {
    profileInfo.style.display = 'none';
    profileEmpty.style.display = 'block';
  }
};

const initProfilePage = () => {
  const student = getStoredStudent();
  if (student) {
    showProfile(student);
  } else {
    showEmptyProfile();
  }

  const logoutButton = document.getElementById('logoutButton');
  if (logoutButton) {
    logoutButton.addEventListener('click', () => {
      localStorage.removeItem(STUDENT_STORAGE_KEY);
      showEmptyProfile();
    });
  }
};

document.addEventListener('DOMContentLoaded', initProfilePage);
