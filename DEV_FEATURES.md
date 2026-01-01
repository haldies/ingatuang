# Development Features (Dev Branch Only)

## 🔐 Authentication System

### Features to Implement
- [ ] User registration with email/password
- [ ] Login with email/password
- [ ] Social login (Google, Apple)
- [ ] Password reset
- [ ] Email verification
- [ ] Session management
- [ ] Biometric authentication (fingerprint/face)

### Files to Create
- `app/(auth)/login.tsx`
- `app/(auth)/register.tsx`
- `app/(auth)/forgot-password.tsx`
- `lib/auth.ts`
- `contexts/AuthContext.tsx`

---

## 🌐 API Integration

### Backend Endpoints
```
Base URL: https://api.ingatuang.com/v1

POST   /auth/register
POST   /auth/login
POST   /auth/logout
GET    /auth/me

GET    /transactions
POST   /transactions
PUT    /transactions/:id
DELETE /transactions/:id

GET    /subscriptions
POST   /subscriptions
PUT    /subscriptions/:id
DELETE /subscriptions/:id

GET    /split-bills
POST   /split-bills
GET    /split-bills/:id
PUT    /split-bills/:id
DELETE /split-bills/:id

POST   /sync/push
POST   /sync/pull
```

### Features to Implement
- [ ] API client setup (axios/fetch)
- [ ] Request/response interceptors
- [ ] Token management
- [ ] Offline queue for failed requests
- [ ] Sync conflict resolution
- [ ] Real-time updates (WebSocket/SSE)

### Files to Create/Modify
- `lib/api-client.ts` - API client configuration
- `lib/sync.ts` - Sync logic
- `lib/api.ts` - Update to use real API instead of mock

---

## 🔌 MCP Connector

### Model Context Protocol Integration
MCP allows the app to connect with AI models and external services.

### Features to Implement
- [ ] MCP client setup
- [ ] Connect to AI services for:
  - Receipt OCR enhancement
  - Smart categorization
  - Spending insights
  - Budget recommendations
- [ ] Context sharing between devices
- [ ] Privacy-preserving data sharing

### Files to Create
- `lib/mcp-client.ts`
- `lib/mcp-config.ts`
- `services/ai-insights.ts`
- `services/smart-categorization.ts`

### Configuration
```typescript
// mcp-config.ts
export const MCP_CONFIG = {
  endpoint: process.env.EXPO_PUBLIC_MCP_ENDPOINT,
  apiKey: process.env.EXPO_PUBLIC_MCP_API_KEY,
  features: {
    ocr: true,
    categorization: true,
    insights: true,
    recommendations: true,
  },
};
```

---

## 🔄 Cloud Sync

### Sync Strategy
- **Offline-first:** All operations work offline
- **Background sync:** Sync when online
- **Conflict resolution:** Last-write-wins with manual resolution option
- **Selective sync:** Sync only changed data

### Implementation Plan
1. Add `synced` flag to all data models
2. Track local changes in sync queue
3. Implement push/pull sync logic
4. Handle conflicts gracefully
5. Show sync status in UI

---

## 📱 Multi-Device Support

### Features
- [ ] Device registration
- [ ] Cross-device sync
- [ ] Device management (view/remove devices)
- [ ] Push notifications across devices
- [ ] Conflict resolution UI

---

## 🔒 Security Considerations

### Data Encryption
- [ ] Encrypt sensitive data at rest
- [ ] Use HTTPS for all API calls
- [ ] Implement certificate pinning
- [ ] Secure token storage (Keychain/Keystore)

### Privacy
- [ ] GDPR compliance
- [ ] Data export functionality
- [ ] Account deletion
- [ ] Privacy policy integration

---

## 🧪 Testing Strategy

### Unit Tests
- Auth flows
- API client
- Sync logic
- Data transformations

### Integration Tests
- Login → Sync → Display data
- Offline → Online transition
- Conflict resolution

### E2E Tests
- Complete user journeys
- Multi-device scenarios

---

## 📦 Environment Variables

Add to `.env`:
```bash
# API Configuration
EXPO_PUBLIC_API_URL=https://api.ingatuang.com/v1
EXPO_PUBLIC_API_KEY=your_api_key_here

# MCP Configuration
EXPO_PUBLIC_MCP_ENDPOINT=https://mcp.ingatuang.com
EXPO_PUBLIC_MCP_API_KEY=your_mcp_key_here

# Feature Flags
EXPO_PUBLIC_ENABLE_AUTH=true
EXPO_PUBLIC_ENABLE_SYNC=true
EXPO_PUBLIC_ENABLE_MCP=true
```

---

## 🚀 Deployment Checklist

Before merging to main:
- [ ] All tests passing
- [ ] API endpoints tested
- [ ] Sync tested with multiple devices
- [ ] Security audit completed
- [ ] Performance testing done
- [ ] Documentation updated
- [ ] Migration guide for existing users
- [ ] Rollback plan ready
