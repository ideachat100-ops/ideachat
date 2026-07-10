/**
 * profile.js — Student Profile Page
 * Uses the shared auth.js module for Google login, phone collection, and state.
 */

import { loginWithGoogle, logout, onStudentAuthChanged, setNavAccountState } from './auth.js';

document.addEventListener('DOMContentLoaded', () => {
  const profileInfo    = document.getElementById('profileInfo');
  const profileEmpty   = document.getElementById('profileEmpty');
  const profileEmail   = document.getElementById('profileEmail');
  const profilePhone   = document.getElementById('profilePhone');
  const profileCourses = document.getElementById('profileCoursesContainer');
  const profileCreated = document.getElementById('profileCreated');
  const logoutButton   = document.getElementById('logoutButton');
  const googleLoginBtn = document.getElementById('googleLoginBtn');

  // ---- UI helpers ----

  const showProfile = (student) => {
    if (!profileInfo || !profileEmpty) return;

    const card = document.querySelector('.profile-page-card');
    if (card) card.style.display = 'block';

    profileInfo.style.display  = 'grid';
    profileEmpty.style.display = 'none';

    if (profileEmail)   profileEmail.textContent   = student.email  || 'N/A';
    if (profilePhone)   profilePhone.textContent   = student.phone  || 'N/A';
    
    if (profileCourses) {
      profileCourses.innerHTML = '';
      if (student.approvedCourses && student.approvedCourses.length > 0) {
        student.approvedCourses.forEach(course => {
          const a = document.createElement('a');
          // Map course name to URL
          if (course.includes('Photoshop')) a.href = 'courses/photoshop-course.html';
          else if (course.includes('Principles')) a.href = 'courses/design-principles.html';
          else a.href = '#';
          
          a.className = 'btn btn-secondary';
          a.style.padding = '8px 16px';
          a.style.fontSize = '13px';
          a.style.textDecoration = 'none';
          a.innerHTML = `${course} <i class="fa-solid fa-arrow-right" style="margin-left: 6px;"></i>`;
          profileCourses.appendChild(a);
        });
      } else {
        const span = document.createElement('span');
        span.textContent = 'Not Enrolled';
        span.style.color = 'var(--text-muted)';
        profileCourses.appendChild(span);
      }
    }
    
    if (profileCreated) profileCreated.textContent = student.createdAt
                                                       ? new Date(student.createdAt).toLocaleDateString()
                                                       : new Date().toLocaleDateString();
  };

  const showEmptyProfile = () => {
    if (!profileInfo || !profileEmpty) return;

    const card = document.querySelector('.profile-page-card');
    if (card) card.style.display = 'none';

    profileInfo.style.display  = 'none';
    profileEmpty.style.display = 'block';
  };

  // ---- Auth state listener ----

  onStudentAuthChanged((authData) => {
    if (authData && authData.student) {
      setNavAccountState(true);
      showProfile(authData.student);
    } else if (authData && authData.user && !authData.student) {
      // Logged in via Google but no DB record yet (phone modal will appear via auth.js)
      setNavAccountState(false);
      showEmptyProfile();
    } else {
      setNavAccountState(false);
      showEmptyProfile();
    }
  });

  // ---- Login button (shown when not logged in) ----

  if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', async (e) => {
      e.preventDefault();
      // loginWithGoogle will handle Google popup → phone modal → redirect back to profile
      // Since we're already on profile.html, we pass type 'profile' but the redirect
      // will just reload this page. That's fine.
      await loginWithGoogle({ type: 'profile' });
    });
  }

  // ---- Logout button ----

  if (logoutButton) {
    logoutButton.addEventListener('click', async () => {
      await logout();
      // onStudentAuthChanged will fire and call showEmptyProfile()
    });
  }
});

