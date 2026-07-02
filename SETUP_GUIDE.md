# India Property Network Ltd. - Complete Setup Guide

## 📋 Table of Contents
1. [System Requirements](#system-requirements)
2. [Installation Steps](#installation-steps)
3. [Development Workflow](#development-workflow)
4. [Project Architecture](#project-architecture)
5. [Backend Setup (Next Steps)](#backend-setup)
6. [Deployment](#deployment)
7. [Troubleshooting](#troubleshooting)

---

## 🖥️ System Requirements

### Required Software
- **Node.js**: v18.0.0 or higher
- **npm**: v9.0.0 or higher (comes with Node.js)
- **Git**: Latest version
- **Code Editor**: VS Code recommended

### Recommended VS Code Extensions
- ESLint
- Prettier
- Tailwind CSS IntelliSense
- TypeScript and JavaScript Language Features
- Auto Rename Tag

---

## 🚀 Installation Steps

### Step 1: Navigate to Frontend Directory
```bash
cd d:\shalinii\ipnl_website\frontend
```

### Step 2: Install Dependencies
```bash
npm install
```

This will install all packages from package.json including:
- React 18 + React DOM
- TypeScript
- Vite
- TailwindCSS
- shadcn/ui components
- React Query, Zustand, Axios
- Socket.io-client
- And many more...

**Expected time**: 2-3 minutes depending on internet speed

### Step 3: Environment Configuration
```bash
# Copy the example environment file
copy .env.example .env.local

# Edit .env.local with your configuration
notepad .env.local
```

**Default configuration**:
```
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
VITE_ENABLE_DEMO_LOGIN=true
```

### Step 4: Start Development Server
```bash
npm run dev
```

The application will start on `http://localhost:3000`

**You should see**:
```
  VITE v5.1.0  ready in 1234 ms

  ➜  Local:   http://localhost:3000/
  ➜  Network: use --host to expose
  ➜  press h to show help
```

### Step 5: Open in Browser
Navigate to `http://localhost:3000` and you'll see the landing page.

---

## 💻 Development Workflow

### Available Scripts

#### `npm run dev`
Starts the development server with hot module replacement (HMR).
- Opens on port 3000
- Auto-reloads on file changes
- Displays compilation errors in console and browser

#### `npm run build`
Creates optimized production build.
- TypeScript type checking
- Vite production optimization
- Output in `/dist` folder
- Minified and bundled

#### `npm run preview`
Preview the production build locally before deployment.
```bash
npm run build
npm run preview
```

#### `npm run lint`
Run ESLint to check for code quality issues.
```bash
npm run lint
```

#### `npm run type-check`
Run TypeScript compiler in check-only mode.
```bash
npm run type-check
```

---

## 🏗️ Project Architecture

### Directory Structure Explained

#### `/src/api` - API Client Layer
- **client.ts**: Axios instance with interceptors (auth, errors)
- **[feature].api.ts**: API endpoints grouped by feature
- All API calls return typed responses using TypeScript

#### `/src/components` - React Components
- **layout/**: Sidebar, Topbar, page layouts
- **ui/**: shadcn/ui primitive components (Button, Input, Card, etc.)
- Feature-specific components organized by page

#### `/src/hooks` - Custom React Hooks
- `useAuth` - Authentication state and methods
- `useMandates` - Mandate CRUD operations with React Query
- `useIntros` - Introduction request management
- `useSocket` - Socket.io real-time connection
- All hooks use React Query for caching and state management

#### `/src/pages` - Route Pages
- Each file represents a route in the application
- Uses React Router v6 for navigation
- Protected routes check authentication status

#### `/src/store` - Zustand Stores
- `authStore.ts` - Global authentication state
- Persisted to localStorage automatically

#### `/src/types` - TypeScript Definitions
- All data models (User, Mandate, Introduction, etc.)
- Enums for status types
- API request/response types
- Mirrors backend database schema

#### `/src/utils` - Utility Functions
- **formatters.ts**: Currency, dates, numbers (Indian format)
- **validators.ts**: PAN, GST, RERA, email, phone validation
- **constants.ts**: App-wide constants (tiers, cities, asset classes)

### Data Flow

```
User Action (Click/Form Submit)
    ↓
Component Handler
    ↓
Custom Hook (useAuth, useMandates)
    ↓
API Client (axios)
    ↓
Backend API (localhost:4000) [TO BE IMPLEMENTED]
    ↓
Response → React Query Cache
    ↓
Component Re-renders with New Data
```

### Authentication Flow

```
Login/Register Form
    ↓
authStore.login(email, password)
    ↓
POST /api/auth/login
    ↓
Response: { user, token }
    ↓
Store in Zustand + localStorage
    ↓
Axios interceptor adds token to all requests
    ↓
Redirect to /dashboard
```

---

## 🔧 Backend Setup (Next Steps)

### Required Backend Endpoints

The frontend expects these API endpoints:

#### Authentication (`/api/auth`)
- `POST /login` - User login
- `POST /register` - New user registration
- `POST /logout` - User logout
- `GET /me` - Get current user
- `POST /demo-login` - Demo account login
- `POST /refresh` - Refresh JWT token

#### Mandates (`/api/mandates`)
- `GET /` - List mandates (with filters)
- `GET /:id` - Get single mandate
- `POST /` - Create mandate
- `PATCH /:id` - Update mandate
- `DELETE /:id` - Delete mandate
- `GET /my` - Get user's mandates
- `PATCH /:id/close` - Close mandate

#### Introductions (`/api/intros`)
- `POST /` - Send introduction request
- `GET /my/:type` - Get sent/received intros
- `PATCH /:id/respond` - Accept/decline intro
- `GET /:id` - Get intro details
- `GET /quota` - Get quota status

#### Messages (`/api/messages`)
- `GET /conversations` - List conversations
- `GET /conversations/:id` - Get conversation
- `GET /:conversationId` - Get messages
- `POST /` - Send message
- `PATCH /:conversationId/read` - Mark as read

#### Admin (`/api/admin`)
- `GET /kyc/queue` - KYC verification queue
- `PATCH /kyc/update` - Approve/reject KYC
- `GET /users` - List all users
- `PATCH /users/:id/suspend` - Suspend user
- `GET /mandates` - All mandates
- `GET /stats/dashboard` - Platform statistics

### Backend Technology Stack (Recommended)
- **NestJS** - Node.js framework
- **PostgreSQL** - Database
- **Prisma** - ORM
- **Socket.io** - Real-time
- **JWT** - Authentication
- **AWS S3** - Document storage

### Database Schema
Refer to `/src/types/index.ts` for data models that need to be created in the database.

---

## 🌐 Deployment

### Frontend Deployment (Vercel/Netlify)

#### Build Command:
```bash
npm run build
```

#### Output Directory:
```
dist/
```

#### Environment Variables (Production):
```
VITE_API_URL=https://api.yourdomain.com/api
VITE_SOCKET_URL=https://api.yourdomain.com
VITE_APP_ENV=production
```

### Vercel Deployment Steps
1. Install Vercel CLI: `npm i -g vercel`
2. Login: `vercel login`
3. Deploy: `vercel --prod`
4. Set environment variables in Vercel dashboard

### Netlify Deployment Steps
1. Install Netlify CLI: `npm i -g netlify-cli`
2. Login: `netlify login`
3. Deploy: `netlify deploy --prod`
4. Set environment variables in Netlify dashboard

---

## 🐛 Troubleshooting

### Issue: Port 3000 is already in use
**Solution**:
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Change port in vite.config.ts
server: { port: 3001 }
```

### Issue: Module not found errors
**Solution**:
```bash
# Delete node_modules and reinstall
rm -rf node_modules
rm package-lock.json
npm install
```

### Issue: TypeScript errors
**Solution**:
```bash
# Check TypeScript configuration
npm run type-check

# Restart VS Code TypeScript server
Ctrl+Shift+P → "TypeScript: Restart TS Server"
```

### Issue: Tailwind styles not applying
**Solution**:
1. Check `tailwind.config.js` content paths
2. Ensure `@tailwind` directives in `index.css`
3. Restart dev server: `Ctrl+C` then `npm run dev`

### Issue: API calls failing (CORS errors)
**Solution**:
1. Ensure backend is running on `localhost:4000`
2. Check backend CORS configuration allows `localhost:3000`
3. Verify proxy configuration in `vite.config.ts`

### Issue: Socket.io not connecting
**Solution**:
1. Check backend Socket.io server is running
2. Verify Socket.io transports in `useSocket.ts`
3. Check browser console for connection errors

---

## 📚 Additional Resources

### Official Documentation
- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/guide/)
- [TailwindCSS Docs](https://tailwindcss.com/docs)
- [shadcn/ui Components](https://ui.shadcn.com)
- [React Query Docs](https://tanstack.com/query/latest)

### Learning Resources
- React Hooks Tutorial
- TypeScript with React
- TailwindCSS Best Practices
- RESTful API Design

---

## 🎯 Next Steps

1. ✅ **Frontend is ready** - All pages and components implemented
2. ⏳ **Implement Backend API** - Use NestJS + PostgreSQL + Prisma
3. ⏳ **Set up Database** - Create tables matching TypeScript types
4. ⏳ **Implement Socket.io** - Real-time messaging and notifications
5. ⏳ **Integrate Payment Gateway** - Razorpay for subscriptions
6. ⏳ **Deploy to Production** - Vercel (frontend) + Railway/Heroku (backend)

---

## 📞 Support

For questions or issues:
- Check the README.md for feature documentation
- Review TypeScript types in `/src/types/index.ts`
- Inspect API client in `/src/api/client.ts`
- Examine component structure in `/src/components`

---

**Last Updated**: 2026-06-15
**Version**: 1.0.0
**Status**: Frontend Complete, Backend Pending
