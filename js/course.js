import { database, ref, get, child, update } from './firebase-config.js';

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

  // Get student from local storage session
  const student = JSON.parse(localStorage.getItem('academyStudentProfile') || 'null');
  
  let hasAccess = false;
  let completedLessons = [];

  if (student && student.id) {
    // Fetch user access from Firebase
    const snap = await get(child(ref(database), `students/${student.id}`));
    if (snap.exists()) {
      const data = snap.val();
      const approved = data.approvedCourses || [];
      hasAccess = approved.includes(courseName);
      completedLessons = data.progress?.[courseKey] || [];
    }
  }

  const accessMessage = document.createElement('div');
  accessMessage.style = 'padding:18px; border-radius:18px; margin-bottom:24px; background: rgba(15, 186, 129, 0.1); color: #0F172A; font-weight: 700;';
  accessMessage.textContent = hasAccess ? 'Payment approved. Click Start learning to unlock the course content.' : 'Payment is pending admin approval. Course content will unlock after approval.';
  const courseWrapper = document.querySelector('.lms-wrapper');
  if (courseWrapper) courseWrapper.insertAdjacentElement('beforebegin', accessMessage);

  const courseContent = document.querySelector('.lms-wrapper');
  const contentSections = document.querySelectorAll('.lms-main > .glass-card, .lms-sidebar .glass-card');
  
  if (!hasAccess) {
    contentSections.forEach((section) => {
      section.classList.add('course-locked');
    });
  } else if (enrollBtn) {
    enrollBtn.textContent = 'Start learning';
    enrollBtn.disabled = false;
    enrollBtn.style.opacity = '1';
  }

  const unlockCourse = () => {
    if (!hasAccess) {
      const selectedCourse = { name: courseName }; // Add full details if needed
      localStorage.setItem('academySelectedCourse', JSON.stringify(selectedCourse));
      window.location.href = '../purchase.html';
      return;
    }
    contentSections.forEach((section) => {
      section.classList.remove('course-locked');
    });
    if (courseContent) courseContent.scrollIntoView({ behavior: 'smooth', block: 'start' });
  };

  if (enrollBtn) {
    enrollBtn.addEventListener('click', unlockCourse);
  }

  // Update progress UI
  const updateProgress = () => {
    const completedCount = completedLessons.length;
    const percentage = Math.round((completedCount / totalLessons) * 100);

    if (progressText) progressText.textContent = `${completedCount} / ${totalLessons} Lessons`;
    if (progressPercent) progressPercent.textContent = `${percentage}%`;
    if (progressBar) progressBar.style.width = `${percentage}%`;

    if (percentage >= 25 && certificateContainer) { // Demo threshold
      certificateContainer.style.display = 'block';
    } else if (certificateContainer) {
      certificateContainer.style.display = 'none';
    }
  };

  // Sync progress to Firebase
  const saveProgress = async () => {
    if (student && student.id) {
      await update(ref(database, `students/${student.id}/progress`), {
        [courseKey]: completedLessons
      });
    }
  };

  // Note: the syllabus accordion rendering is already handled by academy.js
  // But we need to handle the mock lesson items if they still exist statically in the HTML
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
