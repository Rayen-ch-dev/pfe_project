# API Configuration Setup Guide

## 🚀 Quick Setup

### 1. Backend Setup

```bash
cd backend
npm install
npm run dev
```

### 2. Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

## 🔧 Environment Variables

### Backend (.env)
```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
DATABASE_URL="postgresql://username:password@localhost:5432/your-database"
ALLOWED_ORIGINS="http://localhost:5173,http://192.168.1.15:5173"
```

### Frontend (.env)
```env
# For web development
VITE_API_URL=http://localhost:5000

# For mobile development (Expo)
VITE_API_URL=http://192.168.1.15:5000

# Environment
VITE_NODE_ENV=development
```

## 🌐 CORS Configuration

### Development Origins
- Web: `http://localhost:5173` (Vite default)
- Web: `http://192.168.1.15:5173` (Network access)
- Mobile: `exp://192.168.1.15:8081` (Expo)

### Production Origins
Add your production domains to `ALLOWED_ORIGINS` in backend .env

## 📱 Why localhost works in web but not mobile

### Web (localhost)
- ✅ Runs on same machine as backend
- ✅ `localhost` resolves to `127.0.0.1`
- ✅ Direct access to backend on same machine

### Mobile (Expo)
- ❌ Runs on physical device/emulator
- ❌ `localhost` resolves to device/emulator itself
- ❌ Cannot access backend on development machine
- ✅ Must use network IP: `http://192.168.1.15:5000`

## 🧪 Testing API Connection

### Test Backend
```bash
curl http://localhost:5000/api/test
```

### Test Login
```bash
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@ecole.com", "password": "admin123"}'
```

## 🔍 Debugging

### Check Network Access
1. Backend running on port 5000? ✅
2. Frontend can access `http://localhost:5000/api/test`? ✅
3. Mobile can access `http://192.168.1.15:5000/api/test`? ✅

### Common Issues
- **CORS errors**: Check allowed origins in backend
- **Network errors**: Verify IP address and port
- **Auth errors**: Check JWT token and headers

## 🏗️ Production Deployment

### Backend Changes
```env
NODE_ENV=production
ALLOWED_ORIGINS="https://yourdomain.com,https://app.yourdomain.com"
```

### Frontend Changes
```env
VITE_API_URL=https://api.yourdomain.com
```

## 📚 API Usage Examples

### Login
```typescript
import { authService } from './services/authService';

try {
  const result = await authService.login({
    email: 'admin@ecole.com',
    password: 'admin123'
  });
  console.log('Login successful:', result.user);
} catch (error) {
  console.error('Login failed:', error.message);
}
```

### Authenticated Request
```typescript
import { api } from './services/apiClient';

try {
  const users = await api.get('/api/users/profile');
  console.log('User profile:', users);
} catch (error) {
  console.error('API error:', error.message);
}
```

## 🛡️ Security Features

- ✅ JWT token authentication
- ✅ Automatic token injection
- ✅ CORS protection
- ✅ Request/response interceptors
- ✅ Error handling
- ✅ Auto-logout on 401 errors

## 🔄 Environment Switching

### Development
```bash
# Backend
npm run dev

# Frontend (Web)
npm run dev

# Frontend (Mobile)
expo start
```

### Production
```bash
# Backend
npm run build
npm start

# Frontend
npm run build
npm run preview
```
