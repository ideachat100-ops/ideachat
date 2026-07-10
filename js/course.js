/**
 * course.js — Course Content Page Logic
 * Handles video player, progress tracking, and access control.
 * Uses Firebase Auth via the shared auth.js module.
 */

import { database, ref, get, child, update } from './firebase-config.js';
import { getCurrentStudent, setNavAccountState } from './auth.js';

document.addEventListener('DOMContentLoaded', async () => {

  // Video player logic
  const courseVideo = document.getElementById('courseVideo');
  const videoOverlay = document.getElementById('videoPlayOverlay');
  if (courseVideo && videoOverlay) {
    videoOverlay.addEventListener('click', () => {
      courseVideo.controls = true;
      courseVideo.play();
      videoOverlay.style.opacity = '0';
      videoOverlay.style.pointerEvents = 'none';
    });
    courseVideo.addEventListener('ended', () => {
      videoOverlay.style.opacity = '1';
      videoOverlay.style.pointerEvents = 'auto';
      courseVideo.controls = false;
    });
  }

  const enrollBtn = document.getElementById('enrollBtn');
  const lessonItems = document.querySelectorAll('.lesson-item');
  const progressText = document.getElementById('sidebarProgressText');
  const progressPercent = document.getElementById('sidebarProgressPercent');
  const progressBar = document.getElementById('sidebarProgressBar');
  const certificateContainer = document.getElementById('certificateContainer');

  const totalLessons = 32;

  // Determine course from page URL
  const isPhotoshop = window.location.pathname.includes('photoshop-course');
  const courseKey = isPhotoshop ? 'photoshop' : 'principles';
  const courseName = isPhotoshop ? 'Adobe Photoshop & Illustrator Mastery' : 'Graphic Design Core Principles';

  // ---- Auth check ----
  const authData = await getCurrentStudent();
  let student = authData?.student || null;
  let studentUid = authData?.user?.uid || null;

  setNavAccountState(!!(authData && authData.student));

  let hasAccess = false;
  let completedLessons = [];

  if (student && studentUid) {
    const approved = student.approvedCourses || [];
    hasAccess = approved.includes(courseName);
    completedLessons = student.progress?.[courseKey] || [];
  }

  // ---- Access control gate ----
  const courseWrapper = document.querySelector('.lms-wrapper');
  const contentSections = document.querySelectorAll('.lms-main > .glass-card, .lms-sidebar .glass-card');

  if (!hasAccess) {
    // Show a locked overlay instead of the course content
    const lockedBanner = document.createElement('div');
    lockedBanner.style.cssText = `
      padding: 40px; border-radius: 16px; margin: 30px 0;
      background: rgba(239, 68, 68, 0.08); border: 1px solid rgba(239, 68, 68, 0.2);
      text-align: center;
    `;
    lockedBanner.innerHTML = `
      <i class="fa-solid fa-lock" style="font-size: 40px; color: #EF4444; margin-bottom: 16px;"></i>
      <h3 style="color: #E2E8F0; margin-bottom: 12px;">Course Locked</h3>
      <p style="color: #94A3B8; margin-bottom: 20px; max-width: 500px; margin-left: auto; margin-right: auto;">
        ${student ? 'Your payment is pending admin approval. Course content will unlock after the admin verifies your bank slip.'
                  : 'You need to enroll and complete payment to access this course content.'}
      </p>
      <a href="../academy.html" class="btn btn-primary" style="padding: 12px 28px;">
        <i class="fa-solid fa-arrow-left" style="margin-right: 8px;"></i> Back to Academy
      </a>
    `;

    if (courseWrapper) {
      courseWrapper.insertAdjacentElement('beforebegin', lockedBanner);
      courseWrapper.style.display = 'none';
    }
  } else {
    // Show a success banner
    const accessMessage = document.createElement('div');
    accessMessage.style.cssText = `
      padding: 18px; border-radius: 12px; margin-bottom: 24px;
      background: rgba(16, 185, 129, 0.1); border: 1px solid rgba(16, 185, 129, 0.2);
      color: #10B981; font-weight: 600; text-align: center;
    `;
    accessMessage.textContent = '✓ Payment approved. You have full access to this course content.';
    if (courseWrapper) courseWrapper.insertAdjacentElement('beforebegin', accessMessage);

    if (enrollBtn) {
      enrollBtn.textContent = 'Start Course';
      enrollBtn.disabled = false;
      enrollBtn.style.opacity = '1';
    }
  }

  // ---- Enroll / Start Learning button ----
  const unlockCourse = () => {
    if (!hasAccess) {
      const selectedCourse = { name: courseName };
      localStorage.setItem('academySelectedCourse', JSON.stringify(selectedCourse));
      window.location.href = '../purchase.html';
      return;
    }
    contentSections.forEach((section) => {
      section.classList.remove('course-locked');
    });
    if (courseWrapper) courseWrapper.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (enrollBtn) {
    enrollBtn.addEventListener('click', unlockCourse);
  }

  // ---- Progress UI ----
  const updateProgress = () => {
    const completedCount = completedLessons.length;
    const percentage = Math.round((completedCount / totalLessons) * 100);

    if (progressText) progressText.textContent = `${completedCount} / ${totalLessons} Lessons`;
    if (progressPercent) progressPercent.textContent = `${percentage}%`;
    if (progressBar) progressBar.style.width = `${percentage}%`;

    if (percentage >= 25 && certificateContainer) {
      certificateContainer.style.display = 'block';
    } else if (certificateContainer) {
      certificateContainer.style.display = 'none';
    }
  };

  // ---- Save progress to Firebase ----
  const saveProgress = async () => {
    if (studentUid) {
      await update(ref(database, `students/${studentUid}/progress`), {
        [courseKey]: completedLessons
      });
    }
  };

  // ---- Lesson item checkboxes ----
  lessonItems.forEach(item => {
    const lessonId = item.getAttribute('data-lesson-id');
    const checkbox = item.querySelector('.lesson-checkbox');

    if (completedLessons.includes(lessonId)) {
      checkbox.classList.add('checked');
    }

    checkbox.addEventListener('click', async (e) => {
      e.stopPropagation();

      if (!hasAccess) {
        alert('Your payment is pending admin approval before course lessons unlock.');
        return;
      }

      if (completedLessons.includes(lessonId)) {
        completedLessons = completedLessons.filter(id => id !== lessonId);
        checkbox.classList.remove('checked');
      } else {
        completedLessons.push(lessonId);
        checkbox.classList.add('checked');
      }

      updateProgress();
      await saveProgress();
    });

    item.addEventListener('click', () => {
      lessonItems.forEach(i => i.classList.remove('active'));
      item.classList.add('active');

      const overlayTitle = document.querySelector('#videoPlayOverlay h4');
      const title = item.querySelector('h5').textContent;
      if (overlayTitle) overlayTitle.textContent = title;
    });
  });

  updateProgress();
});
