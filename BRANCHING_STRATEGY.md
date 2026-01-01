# Branching Strategy

## Branch Structure

### `main` - Production Branch
**Status:** Production-ready, stable release
**Features:**
- ✅ Core transaction management (income/expense)
- ✅ Subscription tracking
- ✅ Split bill functionality
- ✅ Quick add widget
- ✅ AI parser for receipt scanning
- ✅ Local storage (AsyncStorage)
- ✅ Offline-first functionality

**Excluded Features:**
- ❌ User authentication (login/register)
- ❌ API integration
- ❌ MCP connector
- ❌ Cloud sync

**Deployment:** This branch is used for production builds and releases.

---

### `dev` - Development Branch
**Status:** Active development, testing new features
**Additional Features:**
- 🚧 User authentication system (login/register)
- 🚧 API integration with backend
- 🚧 MCP (Model Context Protocol) connector
- 🚧 Cloud synchronization
- 🚧 Multi-device support

**Purpose:** Test and develop new features before merging to main.

---

## Workflow

### Working on New Features
```bash
# 1. Start from dev branch (ALWAYS pull first!)
git checkout dev
git pull origin dev  # ← Important: Get latest changes

# 2. Create feature branch from dev
git checkout -b feature/your-feature-name

# 3. Develop your feature
# ... make changes ...

# 4. Commit your changes
git add .
git commit -m "feat: your feature description"

# 5. Push feature branch
git push origin feature/your-feature-name

# 6. Merge to dev (after testing)
git checkout dev
git pull origin dev  # ← Check for updates before merge
git merge feature/your-feature-name
git push origin dev

# 7. Delete feature branch (optional)
git branch -d feature/your-feature-name
```

### Releasing to Production
```bash
# 1. Make sure dev is fully tested and stable
git checkout dev
git pull origin dev

# 2. Switch to main and pull latest
git checkout main
git pull origin main  # ← Important: Sync with remote first!

# 3. Merge dev to main
git merge dev

# 4. Resolve conflicts if any
# ... fix conflicts ...
git add .
git commit -m "merge: dev to main for release"

# 5. Push to main
git push origin main

# 6. Tag the release
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0

# 7. Make sure dev is synced with main
git checkout dev
git merge main  # ← Keep dev in sync
git push origin dev
```

### Hotfix on Production
```bash
# 1. Create hotfix from main
git checkout main
git pull origin main  # ← Get latest main
git checkout -b hotfix/issue-description

# 2. Fix the issue
# ... make fixes ...
git add .
git commit -m "fix: issue description"

# 3. Merge to main first
git checkout main
git pull origin main  # ← Check for updates
git merge hotfix/issue-description
git push origin main

# 4. Merge to dev to keep in sync
git checkout dev
git pull origin dev  # ← Check for updates
git merge hotfix/issue-description
git push origin dev

# 5. Delete hotfix branch
git branch -d hotfix/issue-description
```

---

## Branch Protection Rules (Recommended)

### Main Branch
- Require pull request reviews
- Require status checks to pass
- No direct commits
- Only merge from dev or hotfix branches

### Dev Branch
- Allow direct commits for quick iterations
- Merge feature branches via PR
- Regular testing before merging to main

---

## Current Status

**Main Branch:** v1.0.0 - Offline-first app with core features
**Dev Branch:** v1.1.0-dev - Adding authentication and API integration

---

## Notes

- Always test thoroughly in `dev` before merging to `main`
- Keep `main` stable and production-ready at all times
- Use semantic versioning for releases
- Document breaking changes in commit messages


---

## ❓ FAQ

### Q: Harus git pull dulu sebelum merge?
**A:** Ya! Selalu `git pull` sebelum merge untuk menghindari konflik.

```bash
# ❌ Wrong
git checkout main
git merge dev  # Bisa konflik kalau main sudah berubah di remote

# ✅ Correct
git checkout main
git pull origin main  # Sync dulu
git merge dev
```

### Q: Feature branch dibuat dari main atau dev?
**A:** Dari **dev**, bukan main.

```bash
# ✅ Correct
git checkout dev
git pull origin dev
git checkout -b feature/new-feature

# ❌ Wrong
git checkout main
git checkout -b feature/new-feature  # Jangan dari main!
```

### Q: Kalau ada konflik saat merge gimana?
**A:** Resolve manual, lalu commit.

```bash
git merge dev
# CONFLICT in file.tsx

# 1. Buka file, fix konflik
# 2. Stage resolved files
git add file.tsx

# 3. Commit merge
git commit -m "merge: resolve conflicts from dev"
```

### Q: Kapan hapus feature branch?
**A:** Setelah merge ke dev dan sudah di-push.

```bash
# Setelah merge
git checkout dev
git merge feature/login
git push origin dev

# Hapus local
git branch -d feature/login

# Hapus remote (optional)
git push origin --delete feature/login
```

### Q: Boleh commit langsung ke dev?
**A:** Boleh untuk quick fix, tapi lebih baik pakai feature branch.

```bash
# Quick fix (OK)
git checkout dev
git add .
git commit -m "fix: typo"
git push origin dev

# New feature (Better)
git checkout -b feature/new-feature
# ... develop ...
git checkout dev
git merge feature/new-feature
```

### Q: Main dan dev beda jauh, gimana sync?
**A:** Merge main ke dev secara berkala.

```bash
# Sync dev with main
git checkout dev
git pull origin dev
git merge main  # Ambil update dari main
git push origin dev
```

---

## 🎯 Quick Reference

| Action | Command |
|--------|---------|
| Start new feature | `git checkout dev && git pull origin dev && git checkout -b feature/name` |
| Commit changes | `git add . && git commit -m "feat: description"` |
| Merge to dev | `git checkout dev && git pull origin dev && git merge feature/name` |
| Release to main | `git checkout main && git pull origin main && git merge dev` |
| Hotfix | `git checkout main && git pull origin main && git checkout -b hotfix/name` |
| Sync dev with main | `git checkout dev && git merge main` |
| Check current branch | `git branch` or `git status` |
| View all branches | `git branch -a` |
