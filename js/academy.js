import { database, ref, get, child, onValue } from './firebase-config.js';
import { loginWithGoogle, onStudentAuthChanged, setNavAccountState } from './auth.js';

/**
 * IDEACHAT — Academy LMS Core Javascript
 * Handles progress display, Google login modal, enroll routing, and syllabus via Firebase.
 */

// ================= GOOGLE LOGIN MODAL =================

const openGoogleLoginModal = () => {
  const modal = document.getElementById('googleLoginModal');
  if (!modal) return;
  modal.classList.add('open');
  modal.setAttribute('aria-hidden', 'false');
  document.body.style.overflow = 'hidden';
};

const closeGoogleLoginModal = () => {
  const modal = document.getElementById('googleLoginModal');
  if (!modal) return;
  modal.classList.remove('open');
  modal.setAttribute('aria-hidden', 'true');
  document.body.style.overflow = '';
};

// ================= SYLLABUS RENDERING (FIREBASE) =================

const fetchAndRenderSyllabus = async (courseName) => {
  const container = document.getElementById('courseMonthsContainer');
  if (!container) return;

<<<<<<< HEAD
const hideElement = (id) => {
  const el = document.getElementById(id);
  if (el) el.style.display = 'none';
};

const scrollToElement = (id) => {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
};

// Google Sign-In Callback
window.handleGoogleSignIn = (response) => {
  try {
    const loginMessage = document.getElementById('loginMessage');
    
    // Decode JWT token
    const base64Url = response.credential.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));
    const decoded = JSON.parse(jsonPayload);

    const email = decoded.email;
    const name = decoded.name;

    const storedStudent = getStoredStudent() || {
      createdAt: new Date().toISOString()
    };
    
    storedStudent.email = email;
    storedStudent.phone = 'Google Auth'; // placeholder
    storedStudent.name = name;
    storedStudent.password = 'google_oauth_placeholder';
    
    const courseSelect = document.getElementById('courseSelect');
    storedStudent.course = (courseSelect ? courseSelect.value : '') || storedStudent.course || 'None selected';
    
    saveStoredStudent(storedStudent);
    updateAccountIcon(true);
    
    const pendingCourse = JSON.parse(localStorage.getItem('academyEnrollPendingCourse') || 'null');
    if (pendingCourse) {
      localStorage.setItem('academySelectedCourse', JSON.stringify(pendingCourse));
      localStorage.removeItem('academyEnrollPendingCourse');
      window.location.href = 'purchase.html';
      return;
    }
    
    if (loginMessage) loginMessage.textContent = 'Google Login successful. Your profile has been created.';
    closeLoginModal();
    const loginForm = document.getElementById('loginForm');
    if (loginForm) loginForm.reset();
  } catch (error) {
    const loginMessage = document.getElementById('loginMessage');
    if (loginMessage) loginMessage.textContent = 'Failed to process Google Sign-In. Please try again.';
    console.error("Google Sign-In Error: ", error);
  }
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
=======
  const courseSafe = courseName.replace(/[^a-zA-Z0-9]/g, '_');
  const syllabusDbRef = child(ref(database), `syllabus/${courseSafe}`);
  
  onValue(syllabusDbRef, (snapshot) => {
    container.innerHTML = '';
    const data = snapshot.val();
    
    let months = data?.months || [];
    if (!months || months.length === 0) {
      months = Array.from({length: 6}, (_, i) => ({ title: `Month ${i+1}`, days: [] }));
>>>>>>> 8f5444b73ddbf556582c54dea1e6e982071307c5
    }

    const accordionBox = document.createElement('div');
    accordionBox.className = 'accordion-box';
    accordionBox.style = 'background: rgba(15,23,42,0.9); border: 1px solid rgba(148,163,184,0.15); border-radius: 16px; padding: 18px; margin-bottom: 24px;';

    months.forEach((month, monthIndex) => {
      const monthPanel = document.createElement('div');
      monthPanel.className = 'month-panel';
      monthPanel.style = 'margin-bottom: 12px; border: 1px solid rgba(255,255,255,0.05); border-radius: 12px; overflow: hidden;';

      const monthToggle = document.createElement('button');
      monthToggle.type = 'button';
      monthToggle.className = 'month-toggle';
      monthToggle.style = 'width: 100%; display: flex; justify-content: space-between; align-items: center; padding: 14px 18px; background: rgba(255,255,255,0.03); color: var(--text-dark); border: none; font-size: 14px; font-weight: 700; cursor: pointer; text-align: left;';
      monthToggle.innerHTML = `${month.title || 'Month ' + (monthIndex + 1)}<span class="month-arrow" style="transition: transform 0.2s;"></span>`;
      monthPanel.appendChild(monthToggle);

      const monthDays = document.createElement('div');
      monthDays.className = 'month-days';
      monthDays.style = 'max-height: 0; overflow: hidden; transition: max-height 0.3s ease; background: rgba(0,0,0,0.2);';

      const daysWrapper = document.createElement('div');
      daysWrapper.style = 'padding: 16px; display: grid; gap: 12px;';

      const daysArray = month.days ? Object.keys(month.days).map(k => month.days[k]) : [];

      if (daysArray.length === 0) {
        const emptyMsg = document.createElement('p');
        emptyMsg.style = 'color: #94A3B8; font-size: 13px; margin: 0; text-align: center;';
        emptyMsg.textContent = 'No modules added yet.';
        daysWrapper.appendChild(emptyMsg);
      } else {
        daysArray.forEach(day => {
          const dayEntry = document.createElement('div');
          dayEntry.style = 'background: rgba(255,255,255,0.03); border: 1px solid rgba(255,255,255,0.05); padding: 14px; border-radius: 12px;';
          
          const header = document.createElement('div');
          header.style = 'font-weight: 700; color: #E2E8F0; font-size: 13px; margin-bottom: 8px;';
          header.textContent = `${day.day}: ${day.title}`;
          dayEntry.appendChild(header);
          
          const linkContainer = document.createElement('div');
          linkContainer.style = 'display: flex; gap: 10px; flex-wrap: wrap; margin-top: 12px;';
          
          if (day.noteUrl) {
            const noteBtn = document.createElement('a');
            noteBtn.href = day.noteUrl;
            noteBtn.target = '_blank';
            noteBtn.className = 'btn btn-secondary';
            noteBtn.style = 'padding: 6px 12px; font-size: 11px;';
            noteBtn.innerHTML = `<i class="fa-solid fa-file-pdf" style="margin-right: 5px;"></i> Lecture Note`;
            linkContainer.appendChild(noteBtn);
          }
          if (day.toolUrl) {
            const toolBtn = document.createElement('a');
            toolBtn.href = day.toolUrl;
            toolBtn.target = '_blank';
            toolBtn.className = 'btn btn-secondary';
            toolBtn.style = 'padding: 6px 12px; font-size: 11px; border-color: #F59E0B; color: #F59E0B;';
            toolBtn.innerHTML = `<i class="fa-solid fa-file-zipper" style="margin-right: 5px;"></i> Practical Tool`;
            linkContainer.appendChild(toolBtn);
          }
          if (day.zoomLink) {
            const zoomBtn = document.createElement('a');
            zoomBtn.href = day.zoomLink;
            zoomBtn.target = '_blank';
            zoomBtn.className = 'btn btn-secondary';
            zoomBtn.style = 'padding: 6px 12px; font-size: 11px; border-color: #3B82F6; color: #3B82F6;';
            zoomBtn.innerHTML = '<i class="fa-solid fa-video" style="margin-right: 5px;"></i> View Recording';
            linkContainer.appendChild(zoomBtn);
          }
          if (!day.noteUrl && !day.toolUrl && !day.zoomLink) {
             const noFiles = document.createElement('span');
             noFiles.style = 'color: #64748B; font-size: 11px; font-style: italic;';
             noFiles.textContent = 'No materials attached.';
             linkContainer.appendChild(noFiles);
          }
          dayEntry.appendChild(linkContainer);
          daysWrapper.appendChild(dayEntry);
        });
      }
      
      monthDays.appendChild(daysWrapper);
      monthPanel.appendChild(monthDays);
      accordionBox.appendChild(monthPanel);

      monthToggle.addEventListener('click', () => {
        const isOpen = monthPanel.classList.contains('open');
        accordionBox.querySelectorAll('.month-panel').forEach(p => {
          p.classList.remove('open');
          p.querySelector('.month-days').style.maxHeight = '0';
          p.querySelector('.month-arrow').style.transform = 'rotate(0deg)';
        });
        if (!isOpen) {
          monthPanel.classList.add('open');
          monthDays.style.maxHeight = monthDays.scrollHeight + 'px';
          monthToggle.querySelector('.month-arrow').style.transform = 'rotate(180deg)';
        }
      });
    });
    
    container.appendChild(accordionBox);
  });
};

// ================= COURSE DETAILS =================

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

// ================= INIT =================

// Track a pending enroll intent so the Google login modal knows where to redirect
let _pendingEnrollIntent = null;

document.addEventListener('DOMContentLoaded', () => {

  // --- Auth state listener: update nav icon + enroll button labels ---
  let currentAuthData = null;

  onStudentAuthChanged(async (authData) => {
    currentAuthData = authData;

    if (authData && authData.student) {
      setNavAccountState(true);
      await updateEnrollButtons(authData.student);
    } else {
      setNavAccountState(false);
      await updateEnrollButtons(null);
    }
  });

  // --- Nav profile icon click ---
  const navAccountToggle = document.getElementById('navAccountToggle');
  if (navAccountToggle) {
    navAccountToggle.addEventListener('click', (e) => {
      if (currentAuthData && currentAuthData.student) {
        // Already logged in — let the default href (profile.html) handle it
        return;
      }
      e.preventDefault();
      _pendingEnrollIntent = null; // Not an enroll flow
      openGoogleLoginModal();
    });
  }

  // --- Google Sign-In button inside the modal ---
  const googleSignInBtn = document.getElementById('googleSignInBtn');
  if (googleSignInBtn) {
    googleSignInBtn.addEventListener('click', async () => {
      const msg = document.getElementById('googleLoginMessage');
      if (msg) { msg.textContent = 'Opening Google Sign-In...'; msg.style.color = '#fff'; }

      const intent = _pendingEnrollIntent
        ? { type: 'enroll', course: _pendingEnrollIntent }
        : { type: 'profile' };

      closeGoogleLoginModal();
      await loginWithGoogle(intent);
    });
  }

  // --- Modal close handlers ---
  const backdrop = document.getElementById('googleLoginBackdrop');
  const closeBtn = document.getElementById('closeGoogleLoginModal');
  if (backdrop) backdrop.addEventListener('click', closeGoogleLoginModal);
  if (closeBtn) closeBtn.addEventListener('click', closeGoogleLoginModal);

  // --- Enroll buttons ---
  const enrollButtons = document.querySelectorAll('.enroll-button');

  const updateEnrollButtons = async (student) => {
    let approvedCourses = [];
    if (student && student.uid) {
      const snap = await get(child(ref(database), `students/${student.uid}/approvedCourses`));
      if (snap.exists()) {
        approvedCourses = snap.val() || [];
      }
    }

    enrollButtons.forEach((button) => {
      const courseId = button.getAttribute('data-course-id');
      const course = courseDetails[courseId] || {
        name: button.getAttribute('data-course-name') || 'Selected Course',
        price: 'Rs 9,999',
        description: 'Complete the course enrollment through the bank slip upload page.',
        bankName: 'ABC Bank',
        accountNumber: '123-456-789',
        ifsc: 'ABCD0123456',
        page: 'purchase.html'
      };

      const hasAccess = student && approvedCourses.includes(course.name);

      if (hasAccess) {
        button.textContent = 'Start Course';
        button.style.opacity = '1';
        button.dataset.access = 'approved';
      }
    });
  };

  enrollButtons.forEach((button) => {
    button.addEventListener('click', (event) => {
      event.preventDefault();

      const courseId = button.getAttribute('data-course-id');
      const course = courseDetails[courseId] || {
        name: button.getAttribute('data-course-name') || 'Selected Course',
        price: 'Rs 9,999',
        description: 'Complete the course enrollment through the bank slip upload page.',
        bankName: 'ABC Bank',
        accountNumber: '123-456-789',
        ifsc: 'ABCD0123456',
        page: 'purchase.html'
      };

      // If already logged in
      if (currentAuthData && currentAuthData.student) {
        const student = currentAuthData.student;
        const approved = (student.approvedCourses || []).includes(course.name);

        if (approved && course.page) {
          window.location.href = course.page;
        } else {
          localStorage.setItem('academySelectedCourse', JSON.stringify(course));
          window.location.href = 'purchase.html';
        }
        return;
      }

      // Not logged in — open Google login modal with enroll intent
      _pendingEnrollIntent = course;
      openGoogleLoginModal();
    });
  });

  // --- Progress bars ---
  updateProgress();

  // --- Syllabus (only on course detail pages) ---
  const isPhotoshop = window.location.pathname.includes('photoshop-course');
  const isPrinciples = window.location.pathname.includes('design-principles');
  
  if (isPhotoshop) {
    fetchAndRenderSyllabus('Adobe Photoshop & Illustrator Mastery');
  } else if (isPrinciples) {
    fetchAndRenderSyllabus('Graphic Design Core Principles');
  }
});

// ================= PROGRESS =================

const updateProgress = async () => {
  const psContainer = document.getElementById('progressPhotoshopContainer');
  const psVal = document.getElementById('progressPhotoshopValue');
  const psBar = document.getElementById('progressPhotoshopBar');
  const totalPsLessons = 32;

  // Try from localStorage session (quick)
  const session = JSON.parse(localStorage.getItem('academyStudentProfile') || 'null');
  if (session && session.uid && psContainer && psVal && psBar) {
    const snap = await get(child(ref(database), `students/${session.uid}/progress`));
    if (snap.exists()) {
      const progressData = snap.val();
      const completedPs = progressData.photoshop || [];
      const psPercentage = Math.round((completedPs.length / totalPsLessons) * 100);
      psContainer.style.display = 'block';
      psVal.textContent = `${psPercentage}%`;
      setTimeout(() => {
        psBar.style.width = `${psPercentage}%`;
      }, 300);
    }
  }
};
