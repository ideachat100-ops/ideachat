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

  const loadDynamicCourses = async () => {
    try {
      const res = await fetch('api/get_courses.php');
      const courses = await res.json();
      
      const grid = document.getElementById('academyCoursesGrid');
      if (!grid) return;
      
      grid.innerHTML = '';
      
      const student = getStoredStudent();
      const approvedAccess = JSON.parse(localStorage.getItem('academyApprovedAccess') || '[]');
      
      courses.forEach((course, index) => {
        const hasAccess = student && approvedAccess.some((item) => item.studentEmail === student.email && item.courseName === course.title);
        
        let enrollBtnText = 'Enroll Now';
        let enrollBtnStyle = '';
        if (hasAccess) {
          enrollBtnText = 'Start learning';
          enrollBtnStyle = 'opacity: 1;';
        }
        
        // Progress Tracking Keys
        let progressPrefix = '';
        let totalLessons = course.totalLessons;
        if (course.id === 'photoshop-illustrator') progressPrefix = 'ps_';
        if (course.slug === 'design-principles') progressPrefix = 'pr_';
        
        let progressHtml = '';
        if (progressPrefix) {
           const completed = JSON.parse(localStorage.getItem(`${progressPrefix}completed_lessons`) || '[]');
           const isEnrolled = localStorage.getItem(`${progressPrefix}enrolled`) === 'true';
           
           if (completed.length > 0 || isEnrolled) {
             const percentage = Math.round((completed.length / totalLessons) * 100);
             progressHtml = `
              <div class="course-card-progress-wrapper">
                <div class="course-card-progress-text">
                  <span>Course Progress</span>
                  <span>${percentage}%</span>
                </div>
                <div class="course-card-progress-track">
                  <div class="course-card-progress-bar" style="width: ${percentage}%"></div>
                </div>
              </div>
             `;
           }
        }

        const delayClass = index % 2 !== 0 ? 'delay-100' : '';
        const badgeClass = course.badge.toLowerCase().includes('advanced') ? 'advanced' : '';
        
        const card = document.createElement('div');
        card.className = `course-card reveal fade-up ${delayClass}`;
        card.innerHTML = `
          <div class="course-card-img-box">
            <span class="course-badge ${badgeClass}">${course.badge}</span>
            <img src="${course.coverImage}" alt="${course.title}">
          </div>
          <div class="course-card-body">
            <h3 class="course-card-title">${course.title}</h3>
            <p style="color:var(--text-muted); font-size:14px; line-height:1.6; margin-bottom:20px;">
              ${course.description}
            </p>

            <div class="course-meta">
              <span><i class="fa-solid fa-clock"></i> ${course.duration}</span>
              <span><i class="fa-solid fa-book-open"></i> ${course.totalLessons} Lessons</span>
              <span><i class="fa-solid fa-star" style="color:#F59E0B;"></i> ${course.rating} Rating</span>
            </div>

            ${progressHtml}

            <div class="course-tutor">
              <div class="course-tutor-img" ${index % 2 !== 0 ? 'style="background-color: var(--secondary);"' : ''}>
                ${course.instructor.initials}
              </div>
              <div style="flex-grow:1;">
                <h5 style="font-size:14px; font-weight:700;">${course.instructor.name}</h5>
                <p style="font-size:11px; color:var(--text-muted);">${course.instructor.role}</p>
              </div>
              <a href="#" class="btn btn-primary dynamic-enroll-button" data-course='${JSON.stringify(course)}' style="padding:10px 20px; font-size:13px; ${enrollBtnStyle}">${enrollBtnText}</a>
            </div>
          </div>
        `;
        
        grid.appendChild(card);
      });
      
      // Attach click listeners to new enroll buttons
      document.querySelectorAll('.dynamic-enroll-button').forEach(btn => {
        btn.addEventListener('click', (event) => {
          event.preventDefault();
          const currentCourse = JSON.parse(btn.getAttribute('data-course'));
          const currentStudent = getStoredStudent();
          const approvedAccessList = JSON.parse(localStorage.getItem('academyApprovedAccess') || '[]');
          const currentHasAccess = currentStudent && approvedAccessList.some((item) => item.studentEmail === currentStudent.email && item.courseName === currentCourse.title);

          const mappedCourse = {
            name: currentCourse.title,
            price: currentCourse.price,
            description: currentCourse.description,
            bankName: currentCourse.bankPayment.bankName,
            accountNumber: currentCourse.bankPayment.accountNumber,
            ifsc: currentCourse.bankPayment.ifsc,
            page: currentCourse.pageUrl
          };

          if (currentHasAccess && mappedCourse.page) {
            localStorage.setItem('academySelectedCourse', JSON.stringify(mappedCourse));
            window.location.href = mappedCourse.page;
            return;
          }

          localStorage.setItem('academyEnrollPendingCourse', JSON.stringify(mappedCourse));

          if (!currentStudent) {
            const courseSelect = document.getElementById('courseSelect');
            if (courseSelect) courseSelect.value = mappedCourse.name;
            openLoginModal();
            return;
          }

          localStorage.setItem('academySelectedCourse', JSON.stringify(mappedCourse));
          window.location.href = 'purchase.html';
        });
      });
      
    } catch (err) {
      console.error('Error fetching courses from API:', err);
    }
  };

  loadDynamicCourses();

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
  // Progress is now dynamically injected in loadDynamicCourses
};

document.addEventListener('DOMContentLoaded', () => {
  updateProgress();
  initLoginAndReset();
});
