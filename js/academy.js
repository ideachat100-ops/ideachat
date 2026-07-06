/**
 * IDEACHAT - Academy LMS Core Javascript
 * Handles progress display plus student login, profile, and reset flows.
 */

const STUDENT_STORAGE_KEY = 'academyStudentProfile';

const getStoredStudent = () => {
  try {
    return JSON.parse(localStorage.getItem(STUDENT_STORAGE_KEY) || 'null');
  } catch {
    return null;
  }
};

const saveStoredStudent = (student) => {
  localStorage.setItem(STUDENT_STORAGE_KEY, JSON.stringify(student));
};

const formatPhone = (phone) => phone.trim();
const validateEmail = (email) => {
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return re.test(email.trim().toLowerCase());
};
const validatePhone = (phone) => {
  const cleaned = phone.replace(/[^\d+]/g, '');
  return cleaned.length >= 10 && cleaned.length <= 16;
};

const setAccountIcon = (isLoggedIn) => {
  const accountToggle = document.getElementById('navAccountToggle');
  if (!accountToggle) return;
  const icon = accountToggle.querySelector('i');
  const srText = accountToggle.querySelector('.sr-only');
  if (icon) {
    icon.className = isLoggedIn ? 'fa-solid fa-user-circle' : 'fa-solid fa-right-to-bracket';
  }
  if (srText) {
    srText.textContent = isLoggedIn ? 'Open student profile' : 'Open student login';
  }
  accountToggle.setAttribute('aria-label', isLoggedIn ? 'Open student profile' : 'Open student login');
  accountToggle.setAttribute('href', isLoggedIn ? 'profile.html' : '#');
};

const openLoginModal = () => {
  const loginModal = document.getElementById('loginModal');
  if (!loginModal) return;
  loginModal.classList.add('open');
  loginModal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
};

const closeLoginModal = () => {
  const loginModal = document.getElementById('loginModal');
  if (!loginModal) return;
  loginModal.classList.remove('open');
  loginModal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
};

const updateAccountIcon = (isLoggedIn) => {
  setAccountIcon(isLoggedIn);
};

const showElement = (id) => {
  const el = document.getElementById(id);
  if (el) el.style.display = 'block';
};

const hideElement = (id) => {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
};

const scrollToElement = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

const initLoginAndReset = () => {
  const loginForm = document.getElementById('loginForm');
  const resetRequestForm = document.getElementById('resetRequestForm');
  const resetPasswordSubmitForm = document.getElementById('resetPasswordSubmitForm');
  const forgotPasswordLink = document.getElementById('forgotPasswordLink');
  const navAccountToggle = document.getElementById('navAccountToggle');
  const enrollButtons = document.querySelectorAll('.enroll-button');

  const loginMessage = document.getElementById('loginMessage');
  const resetNotice = document.getElementById('resetNotice');
  const resetEmailPreview = document.getElementById('resetEmailPreview');
  const resetMessage = document.getElementById('resetMessage');

  const storedStudent = getStoredStudent();
  if (storedStudent) {
    updateAccountIcon(true);
    hideElement('loginForm');
  } else {
    updateAccountIcon(false);
  }

  if (navAccountToggle) {
    navAccountToggle.addEventListener('click', (event) => {
      const storedStudent = getStoredStudent();
      if (!storedStudent) {
        event.preventDefault();
        openLoginModal();
      }
    });
  }

  if (loginForm) {
    loginForm.addEventListener('submit', (event) => {
      event.preventDefault();

      const emailInput = document.getElementById('loginEmail');
      const phoneInput = document.getElementById('loginPhone');
      const passwordInput = document.getElementById('loginPassword');
      const courseSelect = document.getElementById('courseSelect');
      const email = emailInput ? emailInput.value.trim().toLowerCase() : '';
      const phone = phoneInput ? phoneInput.value.trim() : '';
      const password = passwordInput ? passwordInput.value : '';
      const selectedCourseName = courseSelect ? courseSelect.value : '';
      const storedStudent = getStoredStudent();

      if (!validateEmail(email) && !validatePhone(phone)) {
        if (loginMessage) loginMessage.textContent = 'Enter a valid email or phone number.';
        return;
      }

      if (!password || password.length < 6) {
        if (loginMessage) loginMessage.textContent = 'Password must be at least 6 characters long.';
        return;
      }

      if (storedStudent && storedStudent.email === email && storedStudent.password !== password) {
        if (loginMessage) loginMessage.textContent = 'Incorrect password for this account.';
        return;
      }

      const student = storedStudent || {
        createdAt: new Date().toISOString()
      };
      student.email = email;
      student.phone = phone;
      student.password = password;
      student.course = selectedCourseName || storedStudent?.course || 'None selected';

      saveStoredStudent(student);
      updateAccountIcon(true);

      const pendingCourse = JSON.parse(localStorage.getItem('academyEnrollPendingCourse') || 'null');
      if (pendingCourse) {
        localStorage.setItem('academySelectedCourse', JSON.stringify(pendingCourse));
        localStorage.removeItem('academyEnrollPendingCourse');
        window.location.href = 'purchase.html';
        return;
      }

      if (loginMessage) loginMessage.textContent = 'Login successful. Your profile has been created.';
      closeLoginModal();
      if (loginForm) loginForm.reset();
    });
  }

  const courseDetails = {
    photoshop: {
      name: 'Adobe Photoshop & Illustrator Mastery',
      price: 'Rs 12,000',
      description: 'Master visual manipulation, vector drawings, custom branding, and export-ready print layouts.',
      bankName: 'ABC Bank',
      accountNumber: '123-456-789',
      ifsc: 'ABCD0123456',
      page: 'courses/photoshop-course.html'
    },
    principles: {
      name: 'Graphic Design Core Principles',
      price: 'Rs 10,000',
      description: 'Learn visual hierarchy, grids, typography, contrast, spacing, and layout systems.',
      bankName: 'ABC Bank',
      accountNumber: '123-456-789',
      ifsc: 'ABCD0123456',
      page: 'courses/design-principles.html'
    }
  };

  const approvedAccess = JSON.parse(localStorage.getItem('academyApprovedAccess') || '[]');
  const student = getStoredStudent();

  enrollButtons.forEach((button) => {
    const courseId = button.getAttribute('data-course-id');
    const selectedCourse = courseDetails[courseId] || {
      name: button.getAttribute('data-course-name') || 'Selected Course',
      price: 'Rs 9,999',
      description: 'Complete the course enrollment through the bank slip upload page.',
      bankName: 'ABC Bank',
      accountNumber: '123-456-789',
      ifsc: 'ABCD0123456',
      page: 'purchase.html'
    };

    const hasAccess = student && approvedAccess.some((item) => item.studentEmail === student.email && item.courseName === selectedCourse.name);
    if (hasAccess) {
      button.textContent = 'Start learning';
      button.style.opacity = '1';
      button.dataset.access = 'approved';
    }

    button.addEventListener('click', (event) => {
      event.preventDefault();
      const currentStudent = getStoredStudent();
      const currentCourse = courseDetails[courseId] || selectedCourse;
      const currentHasAccess = currentStudent && approvedAccess.some((item) => item.studentEmail === currentStudent.email && item.courseName === currentCourse.name);

      if (currentHasAccess && currentCourse.page) {
        localStorage.setItem('academySelectedCourse', JSON.stringify(currentCourse));
        window.location.href = currentCourse.page;
        return;
      }

      localStorage.setItem('academyEnrollPendingCourse', JSON.stringify(currentCourse));

      if (!currentStudent) {
        const courseSelect = document.getElementById('courseSelect');
        if (courseSelect) courseSelect.value = currentCourse.name;
        openLoginModal();
        return;
      }

      localStorage.setItem('academySelectedCourse', JSON.stringify(currentCourse));
      window.location.href = 'purchase.html';
    });
  });

  const loginModalBackdrop = document.getElementById('loginModalBackdrop');
  const closeLoginModalButton = document.getElementById('closeLoginModal');

  if (forgotPasswordLink) {
    forgotPasswordLink.addEventListener('click', (event) => {
      event.preventDefault();
      showElement('resetRequest');
      hideElement('resetPasswordForm');
      hideElement('resetNotice');
      const resetRequestSection = document.getElementById('resetRequest');
      if (resetRequestSection) resetRequestSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  if (loginModalBackdrop) {
    loginModalBackdrop.addEventListener('click', () => {
      closeLoginModal();
    });
  }

  if (closeLoginModalButton) {
    closeLoginModalButton.addEventListener('click', () => {
      closeLoginModal();
    });
  }

  if (resetRequestForm) {
    resetRequestForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const email = document.getElementById('resetEmail').value.trim().toLowerCase();
      const stored = getStoredStudent();
      if (!validateEmail(email)) {
        if (loginMessage) loginMessage.textContent = 'Enter a valid email address for password reset.';
        return;
      }
      if (!stored || stored.email !== email) {
        if (loginMessage) loginMessage.textContent = 'No student profile found for that email.';
        return;
      }
      if (loginMessage) loginMessage.textContent = '';
      resetEmailPreview.textContent = email;
      showElement('resetNotice');
      showElement('resetPasswordForm');
      scrollToElement('resetPasswordForm');
    });
  }

  if (resetPasswordSubmitForm) {
    resetPasswordSubmitForm.addEventListener('submit', (event) => {
      event.preventDefault();
      const newPassword = document.getElementById('newPassword').value;
      const confirmPassword = document.getElementById('confirmPassword').value;
      const stored = getStoredStudent();
      if (!stored) {
        if (resetMessage) resetMessage.textContent = 'No active profile to reset.';
        return;
      }
      if (!newPassword || newPassword.length < 6) {
        if (resetMessage) resetMessage.textContent = 'Enter a new password with at least 6 characters.';
        return;
      }
      if (newPassword !== confirmPassword) {
        if (resetMessage) resetMessage.textContent = 'Passwords do not match.';
        return;
      }
      stored.password = newPassword;
      saveStoredStudent(stored);
      if (resetMessage) resetMessage.textContent = 'Password updated successfully. You can use it the next time you log in.';
      if (resetPasswordSubmitForm) resetPasswordSubmitForm.reset();
    });
  }
};

const updateProgress = () => {
  const psContainer = document.getElementById('progressPhotoshopContainer');
  const psVal = document.getElementById('progressPhotoshopValue');
  const psBar = document.getElementById('progressPhotoshopBar');
  const prContainer = document.getElementById('progressPrinciplesContainer');
  const prVal = document.getElementById('progressPrinciplesValue');
  const prBar = document.getElementById('progressPrinciplesBar');
  const totalPsLessons = 32;
  const totalPrLessons = 24;

  const completedPs = JSON.parse(localStorage.getItem('ps_completed_lessons') || '[]');
  if (psContainer && psVal && psBar) {
    if (completedPs.length > 0) {
      const psPercentage = Math.round((completedPs.length / totalPsLessons) * 100);
      psContainer.style.display = 'block';
      psVal.textContent = `${psPercentage}%`;
      setTimeout(() => {
        psBar.style.width = `${psPercentage}%`;
      }, 300);
    } else if (localStorage.getItem('ps_enrolled') === 'true') {
      psContainer.style.display = 'block';
      psVal.textContent = '0%';
      psBar.style.width = '0%';
    }
  }

  const completedPr = JSON.parse(localStorage.getItem('pr_completed_lessons') || '[]');
  if (prContainer && prVal && prBar) {
    if (completedPr.length > 0) {
      const prPercentage = Math.round((completedPr.length / totalPrLessons) * 100);
      prContainer.style.display = 'block';
      prVal.textContent = `${prPercentage}%`;
      setTimeout(() => {
        prBar.style.width = `${prPercentage}%`;
      }, 300);
    } else if (localStorage.getItem('pr_enrolled') === 'true') {
      prContainer.style.display = 'block';
      prVal.textContent = '0%';
      prBar.style.width = '0%';
    }
  }
};

document.addEventListener('DOMContentLoaded', () => {
  updateProgress();
  initLoginAndReset();
});
