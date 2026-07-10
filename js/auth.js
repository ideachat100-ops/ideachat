/**
 * auth.js — Shared Google Authentication Module
 *
 * Centralises all Google Sign-In logic, phone-number collection,
 * and post-login redirect routing for the IdeaChat Academy.
 *
 * Usage from any page:
 *   import { loginWithGoogle, logout, onStudentAuthChanged, getCurrentStudent } from './auth.js';
 */

import {
  auth, googleProvider, signInWithPopup, signOut, onAuthStateChanged,
  database, ref, get, set, child, update
} from './firebase-config.js';

// ---------------------------------------------------------------------------
// Internal state
// ---------------------------------------------------------------------------
let _currentUser = null;   // Firebase Auth user object
let _studentData = null;   // Student record from DB (students/{uid})
const _authCallbacks = [];

// ---------------------------------------------------------------------------
// Phone-number modal (injected into the DOM once, shared across pages)
// ---------------------------------------------------------------------------
const MODAL_ID = 'authPhoneModal';

const ensurePhoneModal = () => {
  if (document.getElementById(MODAL_ID)) return;

  const modal = document.createElement('div');
  modal.id = MODAL_ID;
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  modal.style.cssText = `
    position:fixed; inset:0; background:rgba(0,0,0,0.75);
    display:flex; align-items:center; justify-content:center;
    z-index:10000; opacity:0; pointer-events:none;
    transition:opacity .3s ease;
  `;
  modal.innerHTML = `
    <div style="
      background:var(--bg-card,#1e293b); padding:40px; border-radius:16px;
      border:1px solid rgba(148,163,184,.15); max-width:420px; width:92%;
      box-shadow:0 25px 50px rgba(0,0,0,.5);
    ">
      <h3 style="margin:0 0 12px; font-size:22px; color:var(--text-light,#e2e8f0);">
        Complete Your Profile
      </h3>
      <p style="color:var(--text-muted,#94a3b8); margin-bottom:24px; line-height:1.6; font-size:14px;">
        Please enter your mobile number to finish registration.
      </p>
      <form id="authPhoneForm">
        <label for="authPhoneInput"
          style="display:block; margin-bottom:8px; color:var(--text-light,#e2e8f0); font-weight:500; font-size:14px;">
          Mobile Number
        </label>
        <input type="tel" id="authPhoneInput" placeholder="e.g. 0712345678" required
          style="
            width:100%; padding:12px 16px;
            background:rgba(15,23,42,.5); border:1px solid rgba(148,163,184,.2);
            color:var(--text-light,#e2e8f0); border-radius:8px; font-family:inherit;
            font-size:15px; box-sizing:border-box;
          ">
        <p id="authPhoneError" style="color:#f87171; font-size:13px; margin:8px 0 0; display:none;"></p>
        <button type="submit" class="btn btn-primary"
          style="width:100%; margin-top:18px; padding:13px; font-size:15px;">
          Save &amp; Continue
        </button>
      </form>
    </div>
  `;
  document.body.appendChild(modal);
};

const showPhoneModal = () => {
  ensurePhoneModal();
  const m = document.getElementById(MODAL_ID);
  if (m) { m.style.opacity = '1'; m.style.pointerEvents = 'auto'; }
};

const hidePhoneModal = () => {
  const m = document.getElementById(MODAL_ID);
  if (m) { m.style.opacity = '0'; m.style.pointerEvents = 'none'; }
};

// ---------------------------------------------------------------------------
// DB helpers
// ---------------------------------------------------------------------------

/** Fetch the student record for a given uid. Returns null if none exists. */
const fetchStudentRecord = async (uid) => {
  const snap = await get(child(ref(database), `students/${uid}`));
  return snap.exists() ? snap.val() : null;
};

/** Create or update a student record. */
const saveStudentRecord = async (uid, data) => {
  await set(ref(database, `students/${uid}`), data);
};

// ---------------------------------------------------------------------------
// Core login flow
// ---------------------------------------------------------------------------

/**
 * Trigger Google Sign-In and handle the post-login pipeline.
 *
 * @param {Object} redirectIntent
 *   { type: 'profile' }
 *   { type: 'enroll', course: { name, price, description, bankName, accountNumber, ifsc, page } }
 *
 * @returns {Promise<void>}
 */
export const loginWithGoogle = async (redirectIntent = { type: 'profile' }) => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;
    _currentUser = user;

    // Check if student already exists in DB
    let student = await fetchStudentRecord(user.uid);

    if (student && student.phone) {
      // Existing student with phone — skip modal, go directly to redirect
      _studentData = student;
      // Also keep a lightweight localStorage copy for quick checks on non-module pages
      _persistSession(user, student);
      _performRedirect(redirectIntent, student);
      return;
    }

    // New student OR student without phone — show phone modal
    await _collectPhoneAndSave(user, student, redirectIntent);

  } catch (error) {
    if (error.code === 'auth/popup-closed-by-user') {
      console.log('Login popup closed by user.');
      return;
    }
    console.error('Google Sign-In error:', error);
    alert('Failed to sign in with Google. Please try again.');
  }
};

/**
 * Show the phone modal, wait for submission, save the record, then redirect.
 */
const _collectPhoneAndSave = (user, existingRecord, redirectIntent) => {
  return new Promise((resolve) => {
    showPhoneModal();

    const form = document.getElementById('authPhoneForm');
    const input = document.getElementById('authPhoneInput');
    const errorEl = document.getElementById('authPhoneError');

    const handler = async (e) => {
      e.preventDefault();
      const phone = input.value.trim();

      if (!phone || phone.length < 9) {
        errorEl.textContent = 'Please enter a valid phone number (at least 9 digits).';
        errorEl.style.display = 'block';
        return;
      }
      errorEl.style.display = 'none';

      const studentData = {
        uid: user.uid,
        email: user.email,
        name: user.displayName || 'Student',
        phone: phone,
        createdAt: existingRecord?.createdAt || new Date().toISOString(),
        approvedCourses: existingRecord?.approvedCourses || [],
        progress: existingRecord?.progress || {}
      };

      try {
        await saveStudentRecord(user.uid, studentData);
        _studentData = studentData;
        _persistSession(user, studentData);
        hidePhoneModal();
        form.removeEventListener('submit', handler);
        _performRedirect(redirectIntent, studentData);
        resolve();
      } catch (err) {
        console.error('Error saving student:', err);
        errorEl.textContent = 'Failed to save. Please try again.';
        errorEl.style.display = 'block';
      }
    };

    form.addEventListener('submit', handler);
  });
};

// ---------------------------------------------------------------------------
// Redirect routing
// ---------------------------------------------------------------------------

const _performRedirect = (intent, student) => {
  if (!intent) return;

  switch (intent.type) {
    case 'enroll': {
      const course = intent.course;
      if (!course) break;

      // Check if student already has approval for this course
      const approved = (student.approvedCourses || []).includes(course.name);
      if (approved && course.page) {
        window.location.href = course.page;
      } else {
        // Save course selection and go to purchase page
        localStorage.setItem('academySelectedCourse', JSON.stringify(course));
        window.location.href = 'purchase.html';
      }
      break;
    }
    case 'profile':
      window.location.href = 'profile.html';
      break;
    default:
      break;
  }
};

// ---------------------------------------------------------------------------
// Session persistence (lightweight localStorage for non-module pages)
// ---------------------------------------------------------------------------

const SESSION_KEY = 'academyStudentProfile';

const _persistSession = (user, student) => {
  localStorage.setItem(SESSION_KEY, JSON.stringify({
    uid: user.uid,
    email: student.email,
    name: student.name,
    phone: student.phone,
    id: user.uid
  }));
};

const _clearSession = () => {
  localStorage.removeItem(SESSION_KEY);
  localStorage.removeItem('academyEnrollPendingCourse');
  localStorage.removeItem('academySelectedCourse');
};

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/**
 * Returns { user, student } if logged in, or null.
 * `user` = Firebase Auth User, `student` = DB record.
 */
export const getCurrentStudent = async () => {
  if (_currentUser && _studentData) {
    return { user: _currentUser, student: _studentData };
  }

  return new Promise((resolve) => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      unsub();
      if (user) {
        _currentUser = user;
        _studentData = await fetchStudentRecord(user.uid);
        if (_studentData) {
          _persistSession(user, _studentData);
          resolve({ user, student: _studentData });
        } else {
          resolve({ user, student: null });
        }
      } else {
        resolve(null);
      }
    });
  });
};

/**
 * Sign out of Firebase Auth and clear local session.
 */
export const logout = async () => {
  try {
    await signOut(auth);
    _currentUser = null;
    _studentData = null;
    _clearSession();
  } catch (err) {
    console.error('Logout error:', err);
  }
};

/**
 * Listen for auth state changes.
 * callback receives { user, student } or null.
 */
export const onStudentAuthChanged = (callback) => {
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      _currentUser = user;
      _studentData = await fetchStudentRecord(user.uid);
      if (_studentData) _persistSession(user, _studentData);
      callback({ user, student: _studentData });
    } else {
      _currentUser = null;
      _studentData = null;
      _clearSession();
      callback(null);
    }
  });
};

/**
 * Update the nav account icon to reflect login state.
 */
export const setNavAccountState = (isLoggedIn) => {
  const toggle = document.getElementById('navAccountToggle');
  if (!toggle) return;
  const icon = toggle.querySelector('i');
  const sr = toggle.querySelector('.sr-only');
  if (icon) icon.className = isLoggedIn ? 'fa-solid fa-user-circle' : 'fa-solid fa-right-to-bracket';
  if (sr) sr.textContent = isLoggedIn ? 'Open student profile' : 'Open student login';
  toggle.setAttribute('aria-label', isLoggedIn ? 'Open student profile' : 'Open student login');
  toggle.setAttribute('href', isLoggedIn ? 'profile.html' : '#');
};

export const loginWithGoogleCredential = async (idToken, redirectIntent = { type: 'profile' }) => {
  try {
    const { signInWithCredential, GoogleAuthProvider } = await import('https://www.gstatic.com/firebasejs/10.9.0/firebase-auth.js');
    const credential = GoogleAuthProvider.credential(idToken);
    const result = await signInWithCredential(auth, credential);
    const user = result.user;
    let student = await fetchStudentRecord(user.uid);
    if (student && student.phone) {
      _persistSession(user, student);
      _performRedirect(redirectIntent, student);
      return;
    }
    await _collectPhoneAndSave(user, student, redirectIntent);
  } catch (error) {
    console.error(error);
    alert('Failed to authenticate');
  }
};
