# Quick Start Guide - India Property Network Ltd.

## ⚡ Get Started in 5 Minutes

### 1. Install Dependencies
```bash
cd d:\shalinii\ipnl_website\frontend
npm install
```

### 2. Start Development Server
```bash
npm run dev
```

### 3. Open Browser
Navigate to `http://localhost:3000`

---

## 🎮 Demo Mode

The application includes a demo login feature for quick testing:

1. Go to the Login page
2. Click "Try Demo Account"
3. Explore the full application with pre-populated data

---

## 📱 Available Pages

### Public Pages
- **Landing** (`/`) - Marketing page with pricing tiers
- **Login** (`/login`) - User authentication
- **Register** (`/register`) - New user signup

### Protected Pages (Login Required)
- **Dashboard** (`/dashboard`) - Overview of your activity
- **Marketplace** (`/marketplace`) - Browse all mandates
- **Mandate Detail** (`/mandates/:id`) - View mandate details
- **Post Mandate** (`/post-mandate`) - Create new mandate
- **Messages** (`/messages`) - Direct messaging
- **Leaderboard** (`/leaderboard`) - Top performers
- **Notifications** (`/notifications`) - Activity updates
- **Settings** (`/settings`) - Account management

### Admin Pages (Admin Role Required)
- **KYC Queue** (`/admin/kyc-queue`) - Review KYC submissions
- **Manage Users** (`/admin/users`) - User administration
- **Manage Mandates** (`/admin/mandates`) - Mandate moderation
- **Statistics** (`/admin/stats`) - Platform analytics

### Static Pages
- **Privacy Policy** (`/privacy`)
- **Terms of Service** (`/terms`)
- **RERA Protocol** (`/rera-protocol`)
- **Contact** (`/contact`)

---

## 🛠️ Key Features Implemented

### ✅ Authentication & Authorization
- Login / Register with email & password
- JWT-based authentication
- Role-based access control (User, Admin)
- Demo login for quick testing
- Protected routes with authentication guards

### ✅ User Management
- Three membership tiers: OBSERVER, VERIFIED, ENTERPRISE
- KYC verification workflow (PAN, GST, RERA)
- User profiles with company information
- Reputation scoring system

### ✅ Mandate Management
- Browse marketplace with advanced filters
- Create mandates (Buy/Sell)
- Support for all asset classes (Residential, Commercial, Land, etc.)
- Off-market mandate flagging
- Mandate detail view with full information

### ✅ Introduction System
- Send introduction requests to mandate owners
- Quota management (10/month for VERIFIED tier)
- Accept/decline introduction requests
- Track sent and received introductions

### ✅ Messaging
- Real-time messaging with Socket.io
- Conversation list
- Direct messages after successful introductions
- Unread message indicators

### ✅ Notifications
- Real-time notification system
- Notification types: Intro received, KYC approved, etc.
- Mark as read functionality
- Desktop notifications support

### ✅ Leaderboard
- Rank members by activity
- Filter by week/month/all-time
- Display reputation scores
- Show user's current rank

### ✅ Admin Panel
- KYC verification queue
- User management (suspend, activate, tier upgrades)
- Mandate moderation
- Platform statistics dashboard
- Audit logging

### ✅ UI/UX Features
- Dark theme with gold accents (professional real estate aesthetic)
- Fully responsive design
- Loading states and error handling
- Form validation
- Toast notifications
- Skeleton loaders

---

## 🔌 Backend Integration

### API Endpoints Expected
All endpoints are pre-configured in `/src/api/` folder:
- Authentication API
- Mandates API
- Introductions API
- Messages API
- Notifications API
- Leaderboard API
- Admin API
- Billing API

### Backend Status: ⏳ TO BE IMPLEMENTED
The frontend is fully functional and ready. Backend API needs to be built using:
- **NestJS** (Node.js framework)
- **PostgreSQL** (Database)
- **Prisma** (ORM)
- **Socket.io** (Real-time features)

Refer to `SETUP_GUIDE.md` for detailed backend requirements.

---

## 📦 Technology Stack

### Frontend Framework
- React 18 with TypeScript
- Vite for fast development
- React Router v6 for routing

### State Management
- React Query (TanStack Query) for server state
- Zustand for client state
- Local storage persistence

### UI Library
- TailwindCSS for styling
- shadcn/ui component library
- Radix UI primitives
- Lucide React icons

### Real-time
- Socket.io-client for WebSocket connections
- Automatic reconnection
- Event-based communication

### Form Handling
- React Hook Form
- Zod for validation
- Type-safe forms

### HTTP Client
- Axios with interceptors
- Automatic token injection
- Error handling middleware

---

## 🎯 User Flows

### New User Registration
1. Navigate to `/register`
2. Fill in company details, role, PAN, GST, RERA
3. Submit registration
4. Auto-login after successful registration
5. Redirect to dashboard
6. Status: PENDING_VERIFICATION (OBSERVER tier)
7. Admin reviews KYC documents
8. Upon approval: Upgrade to VERIFIED tier

### Posting a Mandate
1. Login as VERIFIED or ENTERPRISE user
2. Navigate to `/post-mandate`
3. Fill in mandate details (type, asset class, location, price)
4. Add tags and mark as off-market
5. Submit mandate
6. Mandate appears in marketplace
7. Other users can view and send introduction requests

### Requesting Introduction
1. Browse marketplace
2. Click on a mandate
3. View full details
4. Click "Request Introduction"
5. Write introduction message
6. Submit (uses 1 quota from monthly limit)
7. Mandate owner receives notification
8. Owner can accept/decline
9. If accepted: Direct messaging unlocked

### Admin KYC Review
1. Login as ADMIN role
2. Navigate to `/admin/kyc-queue`
3. View pending KYC submissions
4. Review uploaded documents
5. Approve or reject with reason
6. User receives notification
7. Approved users get VERIFIED badge

---

## 🔐 Environment Variables

Create `.env.local` file:
```
VITE_API_URL=http://localhost:4000/api
VITE_SOCKET_URL=http://localhost:4000
VITE_ENABLE_DEMO_LOGIN=true
```

---

## 🚀 Production Build

```bash
npm run build
```

Output in `dist/` folder ready for deployment.

---

## 📝 Code Quality

- ✅ TypeScript strict mode enabled
- ✅ ESLint configured
- ✅ No `any` types used
- ✅ Proper error handling
- ✅ Loading states for all async operations
- ✅ Accessible UI components
- ✅ Responsive design

---

## 🐛 Known Limitations

1. **Backend Not Implemented** - All API calls will fail until backend is ready
2. **Demo Data** - Currently using mock data for demo login
3. **File Uploads** - KYC document upload UI ready, backend integration pending
4. **Payment Gateway** - Subscription payment flow UI ready, integration pending
5. **Email Notifications** - UI ready, email service integration pending

---

## 📞 Support & Documentation

- `README.md` - Full project documentation
- `SETUP_GUIDE.md` - Detailed setup instructions
- `/src/types/index.ts` - Complete TypeScript type definitions
- `/src/api/` - API endpoint documentation
- `/src/utils/constants.ts` - App configuration

---

## ✨ What's Next?

1. ⏳ Build Backend API
2. ⏳ Set up PostgreSQL Database
3. ⏳ Implement Socket.io Server
4. ⏳ Integrate Payment Gateway (Razorpay)
5. ⏳ Set up AWS S3 for KYC documents
6. ⏳ Deploy to Production (Vercel + Railway)

---

**Status**: ✅ Frontend Complete | ⏳ Backend Pending  
**Version**: 1.0.0  
**Last Updated**: 2026-06-15
