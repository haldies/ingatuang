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
# Start from dev branch
git checkout dev
git pull origin dev

# Create feature branch
git checkout -b feature/your-feature-name

# After development
git add .
git commit -m "feat: your feature description"
git push origin feature/your-feature-name

# Create PR to dev branch
```

### Releasing to Production
```bash
# Merge dev to main after thorough testing
git checkout main
git merge dev
git push origin main

# Tag release
git tag -a v1.0.0 -m "Release version 1.0.0"
git push origin v1.0.0
```

### Hotfix on Production
```bash
# Create hotfix from main
git checkout main
git checkout -b hotfix/issue-description

# After fix
git add .
git commit -m "fix: issue description"

# Merge to both main and dev
git checkout main
git merge hotfix/issue-description
git checkout dev
git merge hotfix/issue-description
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
