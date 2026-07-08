/**
 * IdeaChat — Site Data Layer (data/db.js)
 *
 * This module acts as the single interface between the website and its
 * data. It:
 *   1. Fetches data/database.json on first load and seeds localStorage.
 *   2. Exposes a clean API (IdeaChatDB) for every feature that needs data.
 *   3. Lets the admin export the full live database as a JSON download.
 *
 * Usage
 * -----
 *   <script src="data/db.js"></script>
 *   IdeaChatDB.ready().then(() => { ... });
 *
 * For pages inside /courses/ use src="../data/db.js"
 */

(function (global) {
  'use strict';

  /* ─── Storage key registry ────────────────────────────────────────── */
  const KEYS = {
    STUDENT:          'academyStudentProfile',
    PURCHASES:        'academyPurchases',
    APPROVED_ACCESS:  'academyApprovedAccess',
    SYLLABUS:         'academySyllabusData',
    PORTFOLIO:        'academyPortfolioData',
    SELECTED_COURSE:  'academySelectedCourse',
    COURSE_ACCESS:    'academyCourseAccess',
    DB_SEEDED:        'ideachatDbSeeded',   // flag: have we seeded from JSON?
    DB_COURSES:       'ideachatCourses',    // static course catalogue
    DB_SERVICES:      'ideachatServices',   // static services list
    DB_SITE:          'ideachatSiteConfig', // site-level config
  };

  /* ─── Helpers ─────────────────────────────────────────────────────── */
  const parse = (key, fallback) => {
    try { return JSON.parse(localStorage.getItem(key) ?? 'null') ?? fallback; }
    catch { return fallback; }
  };
  const save  = (key, data) => localStorage.setItem(key, JSON.stringify(data));

  /* ─── Resolve the path to database.json from any page depth ──────── */
  const resolveDatabasePath = () => {
    const depth = window.location.pathname.split('/').filter(Boolean).length;
    // If we're at root or one level deep on the same origin we can guess:
    // Anything inside /courses/ is one level deeper.
    const prefix = window.location.pathname.includes('/courses/') ? '../' : '';
    return `${prefix}data/database.json`;
  };

  /* ─── Seed localStorage from database.json (runs once per device) ── */
  const seedFromDatabase = async () => {
    if (localStorage.getItem(KEYS.DB_SEEDED)) return; // already seeded
    try {
      const url  = resolveDatabasePath();
      const resp = await fetch(url);
      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);
      const db = await resp.json();

      // Seed static lookup tables (won't overwrite user-generated content)
      if (db.courses)            save(KEYS.DB_COURSES,    db.courses);
      if (db.services)           save(KEYS.DB_SERVICES,   db.services);
      if (db.site)               save(KEYS.DB_SITE,       db.site);

      // Pre-populate syllabus with sample modules IF nothing exists yet
      if (!localStorage.getItem(KEYS.SYLLABUS) && db.sampleSyllabusModules) {
        save(KEYS.SYLLABUS, db.sampleSyllabusModules);
      }

      // Mark as seeded
      save(KEYS.DB_SEEDED, { seededAt: new Date().toISOString(), version: db._meta?.version ?? '1.0.0' });
      console.info('[IdeaChatDB] Seeded from database.json ✓');
    } catch (err) {
      console.warn('[IdeaChatDB] Could not seed from database.json:', err.message);
    }
  };

  /* ═══════════════════════════════════════════════════════════════════
     PUBLIC API
  ═══════════════════════════════════════════════════════════════════ */
  const IdeaChatDB = {};

  /** Returns a Promise that resolves when the DB is seeded and ready. */
  IdeaChatDB.ready = async () => {
    await seedFromDatabase();
  };

  /* ── Site Config ──────────────────────────────────────────────────── */
  IdeaChatDB.getSiteConfig = () => parse(KEYS.DB_SITE, {});

  /* ── Courses ──────────────────────────────────────────────────────── */

  /** Returns the full course catalogue array. */
  IdeaChatDB.getCourses = () => parse(KEYS.DB_COURSES, []);

  /** Returns a single course by its id field. */
  IdeaChatDB.getCourse = (id) =>
    IdeaChatDB.getCourses().find(c => c.id === id) ?? null;

  /** Returns a single course by its title (used with legacy localStorage code). */
  IdeaChatDB.getCourseByTitle = (title) =>
    IdeaChatDB.getCourses().find(c => c.title === title) ?? null;

  /* ── Services ─────────────────────────────────────────────────────── */

  /** Returns the services list. */
  IdeaChatDB.getServices = () => parse(KEYS.DB_SERVICES, []);

  /** Returns a single service by id. */
  IdeaChatDB.getService = (id) =>
    IdeaChatDB.getServices().find(s => s.id === id) ?? null;

  /* ── Syllabus ─────────────────────────────────────────────────────── */

  /** Returns the entire syllabus store (object keyed by course title). */
  IdeaChatDB.getSyllabusStore = () => parse(KEYS.SYLLABUS, {});

  /**
   * Returns syllabus data for one course.
   * If no data exists, returns a default skeleton with 6 empty months.
   */
  IdeaChatDB.getSyllabus = (courseName) => {
    const store = IdeaChatDB.getSyllabusStore();
    if (store[courseName]) return store[courseName];
    return {
      courseName,
      months: Array.from({ length: 6 }, (_, i) => ({
        monthIndex: i,
        title: `Month ${i + 1}`,
        days: []
      }))
    };
  };

  /** Persists updated syllabus data for a course. */
  IdeaChatDB.saveSyllabus = (data) => {
    const store = IdeaChatDB.getSyllabusStore();
    store[data.courseName] = data;
    save(KEYS.SYLLABUS, store);
  };

  /**
   * Adds a new module (day entry) to a course's month.
   * @param {string} courseName
   * @param {number} monthIndex  0-based index
   * @param {{ day, title, note, tool, zoomLink }} module
   */
  IdeaChatDB.addSyllabusModule = (courseName, monthIndex, module) => {
    const data = IdeaChatDB.getSyllabus(courseName);
    while (data.months.length <= monthIndex) {
      data.months.push({ monthIndex: data.months.length, title: `Month ${data.months.length + 1}`, days: [] });
    }
    data.months[monthIndex].days.push({
      id: Date.now().toString() + Math.random().toString(36).slice(2),
      ...module
    });
    IdeaChatDB.saveSyllabus(data);
  };

  /** Removes a module by its id from any month of a course. */
  IdeaChatDB.deleteSyllabusModule = (courseName, moduleId) => {
    const data = IdeaChatDB.getSyllabus(courseName);
    data.months.forEach(m => {
      m.days = m.days.filter(d => d.id !== moduleId);
    });
    IdeaChatDB.saveSyllabus(data);
  };

  /* ── Portfolio ────────────────────────────────────────────────────── */

  /** Returns the full portfolio items array. */
  IdeaChatDB.getPortfolio = () => parse(KEYS.PORTFOLIO, []);

  /** Adds a new portfolio item to the front of the list. */
  IdeaChatDB.addPortfolioItem = (item) => {
    const data = IdeaChatDB.getPortfolio();
    data.unshift({ id: Date.now().toString(), ...item });
    save(KEYS.PORTFOLIO, data);
  };

  /** Removes a portfolio item by id. */
  IdeaChatDB.deletePortfolioItem = (id) => {
    const data = IdeaChatDB.getPortfolio().filter(i => i.id !== id);
    save(KEYS.PORTFOLIO, data);
  };

  /* ── Student Profile ──────────────────────────────────────────────── */

  /** Returns the current student profile or null. */
  IdeaChatDB.getStudent = () => parse(KEYS.STUDENT, null);

  /** Saves / updates the student profile. */
  IdeaChatDB.saveStudent = (profile) => save(KEYS.STUDENT, profile);

  /** Removes the student profile (logout). */
  IdeaChatDB.clearStudent = () => localStorage.removeItem(KEYS.STUDENT);

  /* ── Purchase Requests ────────────────────────────────────────────── */

  /** Returns all purchase/payment requests. */
  IdeaChatDB.getPurchases = () => parse(KEYS.PURCHASES, []);

  /** Saves the full purchases array. */
  IdeaChatDB.savePurchases = (purchases) => save(KEYS.PURCHASES, purchases);

  /**
   * Adds a new purchase request if one doesn't exist for this
   * student + course combination.
   */
  IdeaChatDB.addPurchase = (course, student) => {
    if (!course || !student) return;
    const purchases = IdeaChatDB.getPurchases();
    const exists = purchases.some(
      p => p.studentEmail === student.email && p.courseName === course.name
    );
    if (exists) return;
    purchases.push({
      id:               `purchase_${Date.now()}`,
      studentEmail:     student.email,
      studentPhone:     student.phone,
      courseName:       course.name,
      coursePrice:      course.price,
      courseDescription: course.description,
      bankSlip:         'Uploaded',
      status:           'pending',
      requestedAt:      new Date().toISOString()
    });
    save(KEYS.PURCHASES, purchases);
  };

  /** Updates the status ('approved' | 'rejected') of a purchase by id. */
  IdeaChatDB.setPurchaseStatus = (id, status) => {
    const purchases = IdeaChatDB.getPurchases();
    const idx = purchases.findIndex(p => p.id === id);
    if (idx === -1) return;
    purchases[idx].status = status;
    save(KEYS.PURCHASES, purchases);
    return purchases[idx];
  };

  /* ── Course Access (Approved Enrollments) ─────────────────────────── */

  /** Returns all approved access records. */
  IdeaChatDB.getApprovedAccess = () => parse(KEYS.APPROVED_ACCESS, []);

  /**
   * Grants a student access to a course.
   * No-op if the access record already exists.
   */
  IdeaChatDB.grantAccess = (studentEmail, courseName) => {
    if (!studentEmail || !courseName) return;
    const records = IdeaChatDB.getApprovedAccess();
    if (records.some(r => r.studentEmail === studentEmail && r.courseName === courseName)) return;
    records.push({ studentEmail, courseName, approvedAt: new Date().toISOString() });
    save(KEYS.APPROVED_ACCESS, records);
  };

  /**
   * Returns true if the student has approved access to the course.
   */
  IdeaChatDB.hasAccess = (studentEmail, courseName) => {
    if (!studentEmail || !courseName) return false;
    return IdeaChatDB.getApprovedAccess().some(
      r => r.studentEmail === studentEmail && r.courseName === courseName
    );
  };

  /* ── Admin Stats ──────────────────────────────────────────────────── */

  /** Returns an object with summary counts for the admin dashboard. */
  IdeaChatDB.getAdminStats = () => {
    const purchases = IdeaChatDB.getPurchases();
    return {
      totalStudents: IdeaChatDB.getStudent() ? 1 : 0,
      totalPayments: purchases.length,
      pendingPayments: purchases.filter(p => p.status === 'pending').length
    };
  };

  /* ── Export / Backup ──────────────────────────────────────────────── */

  /**
   * Assembles the full live data state and triggers a JSON download.
   * Useful for admin backup before clearing browser storage.
   */
  IdeaChatDB.exportSnapshot = () => {
    const snapshot = {
      _meta: {
        exportedAt: new Date().toISOString(),
        source: 'IdeaChat Site Live Export'
      },
      site:           parse(KEYS.DB_SITE, {}),
      courses:        parse(KEYS.DB_COURSES, []),
      services:       parse(KEYS.DB_SERVICES, []),
      syllabus:       parse(KEYS.SYLLABUS, {}),
      portfolio:      parse(KEYS.PORTFOLIO, []),
      student:        parse(KEYS.STUDENT, null),
      purchases:      parse(KEYS.PURCHASES, []),
      approvedAccess: parse(KEYS.APPROVED_ACCESS, [])
    };
    const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
    const a    = document.createElement('a');
    a.href     = URL.createObjectURL(blob);
    a.download = `ideachat-backup-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  /**
   * Imports a previously exported snapshot JSON file.
   * Overwrites all existing data except the seed flag.
   * @param {File} file — a .json File object from an <input type="file">
   */
  IdeaChatDB.importSnapshot = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const snapshot = JSON.parse(e.target.result);
          if (snapshot.courses)        save(KEYS.DB_COURSES,   snapshot.courses);
          if (snapshot.services)       save(KEYS.DB_SERVICES,  snapshot.services);
          if (snapshot.site)           save(KEYS.DB_SITE,      snapshot.site);
          if (snapshot.syllabus)       save(KEYS.SYLLABUS,     snapshot.syllabus);
          if (snapshot.portfolio)      save(KEYS.PORTFOLIO,    snapshot.portfolio);
          if (snapshot.student)        save(KEYS.STUDENT,      snapshot.student);
          if (snapshot.purchases)      save(KEYS.PURCHASES,    snapshot.purchases);
          if (snapshot.approvedAccess) save(KEYS.APPROVED_ACCESS, snapshot.approvedAccess);
          resolve(snapshot);
        } catch (err) {
          reject(err);
        }
      };
      reader.onerror = reject;
      reader.readAsText(file);
    });
  };

  /** Clears the seed flag so the DB will re-seed from database.json on next page load. */
  IdeaChatDB.resetSeed = () => localStorage.removeItem(KEYS.DB_SEEDED);

  /** Exposes the storage key map for any code that still needs raw access. */
  IdeaChatDB.KEYS = Object.freeze(KEYS);

  /* ─── Attach to global scope ──────────────────────────────────────── */
  global.IdeaChatDB = IdeaChatDB;

  /* ─── Auto-seed on script load (non-blocking) ─────────────────────── */
  seedFromDatabase();

})(window);
