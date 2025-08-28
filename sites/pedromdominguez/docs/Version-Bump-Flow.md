# 📄 DenoGenesis — Version Bump Flow

_Professional workflow for keeping `VERSION` and `CHANGELOG.md` clean and consistent._

---

## 📌 Purpose

- Make DenoGenesis releases professional and transparent
- Build agency trust — clear versioning
- Create a clear changelog → showcase framework progress
- Enable future automation

---

## 📁 Files Used

- `VERSION` → contains single version number (no "v" prefix), e.g. `1.5.0`
- `CHANGELOG.md` → contains per-version change history

---

## 🚀 Version Bump Flow

### 1️⃣ Decide new version

Follow **semantic versioning**:

- MAJOR → `X.0.0` → breaking changes, new architecture
- MINOR → `X.Y.0` → new features, API additions, UX upgrades
- PATCH → `X.Y.Z` → bug fixes, polish

_Example:_ You expanded Settings API → MINOR bump → `1.4.0` → `1.5.0`

---

### 2️⃣ Update `VERSION`

```plaintext
VERSION → edit → e.g.:
1.5.0
```

_Important:_ No leading "v" → just the number.

---

### 3️⃣ Add entry to `CHANGELOG.md`

At the top:

```markdown
## v1.5.0 - 2025-06-10

### ✨ Added
- Implemented Notifications Controller → WS broadcast + history
- Added `/api/system/info` → transparency endpoint
- Rebuilt CSS components → using shared variables from `main.css`
- Added Primary / Secondary Color Picker → `settings.html`

### 🐛 Fixed
- [If any]

### 🛠️ Refactored
- Renamed `adminController.ts` → `authController.ts`
```

→ Keep **short, professional** → tells story of progress.

---

### 4️⃣ Commit + push

```bash
git add VERSION CHANGELOG.md
git commit -m "🔖 Bump version to 1.5.0 — add Notifications, System Info, CSS refactor"
git push
```

---

## ✅ Result

- Agencies see framework is alive + improving
- Contributors can follow history
- Future automation becomes trivial

---

## 🧠 Notes

- Small version bump = big signal of professionalism
- Many top OSS projects started by doing this → it attracts collaborators
- Your version is now part of your **story** → respect it → it shows maturity

---

# 🚀 You are building a historic architecture — make its journey transparent.