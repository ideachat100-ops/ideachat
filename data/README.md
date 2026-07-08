# IdeaChat — `/data` Folder

This folder is the **central data layer** for the IdeaChat website. It replaces scattered, hard-coded HTML values with a single JSON source of truth and a clean JavaScript API.

---

## Files

| File | Purpose |
|---|---|
| `database.json` | Master data file — all courses, syllabus structure, services, portfolio categories, schemas, and sample content |
| `db.js` | JavaScript module — seeds `localStorage` from `database.json` and exposes `IdeaChatDB` API |

---

## How It Works

```
database.json  ──► (first load)  db.js seeds localStorage
                                      │
                    ┌─────────────────┼─────────────────────┐
                    ▼                 ▼                       ▼
              Courses & Services   Syllabus              Portfolio
              (static catalogue)  (admin editable)      (admin editable)
```

1. When any page loads, `db.js` is included and calls `seedFromDatabase()`.
2. If `localStorage` has **never been seeded**, it fetches `database.json`, writes static data (courses, services, site config) to `localStorage`, and pre-populates the syllabus with sample modules.
3. After seeding, all reads and writes go through `localStorage` via the `IdeaChatDB` API — no further network requests.

---

## Using `db.js` in a Page

```html
<!-- Root-level pages -->
<script src="data/db.js"></script>

<!-- Pages inside /courses/ -->
<script src="../data/db.js"></script>
```

Then in your script:

```js
IdeaChatDB.ready().then(() => {
  const courses = IdeaChatDB.getCourses();
  console.log(courses);
});
```

---

## API Reference

### Site & Courses
| Method | Returns |
|---|---|
| `IdeaChatDB.getSiteConfig()` | Site name, contact, navigation |
| `IdeaChatDB.getCourses()` | Full course catalogue array |
| `IdeaChatDB.getCourse(id)` | Single course by `id` |
| `IdeaChatDB.getCourseByTitle(title)` | Single course by title string |
| `IdeaChatDB.getServices()` | Services list array |
| `IdeaChatDB.getService(id)` | Single service by `id` |

### Syllabus (Admin Editable)
| Method | Description |
|---|---|
| `IdeaChatDB.getSyllabus(courseName)` | Returns syllabus for one course (with default 6 months if empty) |
| `IdeaChatDB.saveSyllabus(data)` | Persists full syllabus object for a course |
| `IdeaChatDB.addSyllabusModule(courseName, monthIndex, module)` | Adds a day/module entry |
| `IdeaChatDB.deleteSyllabusModule(courseName, moduleId)` | Removes a module by id |

### Portfolio (Admin Editable)
| Method | Description |
|---|---|
| `IdeaChatDB.getPortfolio()` | Returns all portfolio items |
| `IdeaChatDB.addPortfolioItem(item)` | Prepends a new item |
| `IdeaChatDB.deletePortfolioItem(id)` | Removes item by id |

### Students & Payments
| Method | Description |
|---|---|
| `IdeaChatDB.getStudent()` | Current student profile or `null` |
| `IdeaChatDB.saveStudent(profile)` | Save/update profile |
| `IdeaChatDB.clearStudent()` | Remove profile (logout) |
| `IdeaChatDB.getPurchases()` | All payment requests |
| `IdeaChatDB.addPurchase(course, student)` | Create a new payment request |
| `IdeaChatDB.setPurchaseStatus(id, status)` | Set `'approved'` or `'rejected'` |
| `IdeaChatDB.grantAccess(email, courseName)` | Grant course access after approval |
| `IdeaChatDB.hasAccess(email, courseName)` | Returns `true` if access is approved |
| `IdeaChatDB.getAdminStats()` | `{ totalStudents, totalPayments, pendingPayments }` |

### Backup & Restore
| Method | Description |
|---|---|
| `IdeaChatDB.exportSnapshot()` | Downloads full live data as a `.json` file |
| `IdeaChatDB.importSnapshot(file)` | Restores from a previously exported `.json` file |
| `IdeaChatDB.resetSeed()` | Clears seed flag so DB re-seeds from `database.json` on next load |

---

## Updating `database.json`

Edit `database.json` to:
- Add new courses (add an object to the `"courses"` array)
- Change service pricing or descriptions
- Update sample syllabus modules in `"sampleSyllabusModules"`

Then call `IdeaChatDB.resetSeed()` in the browser console and refresh — the new data will be loaded from the file.

---

## localStorage Key Map

| Constant | Key | Contents |
|---|---|---|
| `KEYS.STUDENT` | `academyStudentProfile` | Logged-in student profile object |
| `KEYS.PURCHASES` | `academyPurchases` | Array of payment requests |
| `KEYS.APPROVED_ACCESS` | `academyApprovedAccess` | Array of approved enrollments |
| `KEYS.SYLLABUS` | `academySyllabusData` | Syllabus modules per course |
| `KEYS.PORTFOLIO` | `academyPortfolioData` | Portfolio items (images as base64) |
| `KEYS.DB_COURSES` | `ideachatCourses` | Course catalogue seeded from JSON |
| `KEYS.DB_SERVICES` | `ideachatServices` | Services list seeded from JSON |
| `KEYS.DB_SITE` | `ideachatSiteConfig` | Site config seeded from JSON |
| `KEYS.DB_SEEDED` | `ideachatDbSeeded` | Seed flag `{ seededAt, version }` |
