# INDIA PROPERTY NETWORKS (IPN)

**The Exclusive Verified Network for India's Real Estate Deal Economy**

A private, invite-adjacent B2B marketplace connecting developers, funds, landowners, REITs, family offices, redevelopment societies, brokers, and investors through off-market real estate mandates.

---

## 🎯 Core Value Proposition

- **Off-market mandates only** (buy-side and sell-side)
- **KYC-verified members** – admin-reviewed before transacting
- **Subscription-based** – NO brokerage fees
- **Three-step journey**: Discover → Verify → Connect

---

## 💎 Membership Tiers

| Tier | Price | Features |
|------|-------|----------|
| **OBSERVER** | Free | Browse-only, no introductions, anonymous profile |
| **VERIFIED** | ₹24,000/year | KYC + admin reviewed, 10 intros/month, direct messaging |
| **ENTERPRISE** | Custom | Unlimited intros, team seats, mandate concierge |

---

## 🛠️ Tech Stack

### Frontend
- **React 18** + TypeScript
- **Vite** (bundler)
- **TailwindCSS** (dark professional palette)
- **shadcn/ui** (component library)
- **React Router v6**
- **React Query** (TanStack Query) for server state
- **Zustand** for client/auth state
- **Socket.io-client** for real-time features

### Backend (To be implemented)
- **Node.js** + **NestJS**
- **PostgreSQL** + **Prisma ORM**
- **Socket.io** for real-time messaging
- **JWT** authentication
- **AWS S3** for document storage

---

## 📁 Project Structure

```
frontend/
├── src/
│   ├── api/                  # API client & endpoints
│   │   ├── client.ts         # Axios instance with interceptors
│   │   ├── auth.api.ts       # Authentication endpoints
│   │   ├── mandates.api.ts   # Mandate CRUD operations
│   │   ├── intros.api.ts     # Introduction requests
│   │   ├── messages.api.ts   # Messaging endpoints
│   │   ├── notifications.api.ts
│   │   ├── leaderboard.api.ts
│   │   ├── billing.api.ts
│   │   └── admin.api.ts      # Admin operations
│   │
│   ├── components/
│   │   ├── layout/           # Sidebar, Topbar, Layouts
│   │   ├── ui/               # shadcn/ui components
│   │   └── ...               # Feature-specific components
│   │
│   ├── hooks/                # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useMandates.ts
│   │   ├── useIntros.ts
│   │   ├── useConversations.ts
│   │   ├── useNotifications.ts
│   │   ├── useLeaderboard.ts
│   │   └── useSocket.ts      # Socket.io integration
│   │
│   ├── pages/                # Route pages
│   │   ├── Landing.tsx
│   │   ├── Auth.tsx
│   │   ├── Marketplace.tsx
│   │   ├── MandateDetail.tsx
│   │   ├── Dashboard.tsx
│   │   ├── PostMandate.tsx
│   │   ├── Messages.tsx
│   │   ├── Leaderboard.tsx
│   │   ├── Notifications.tsx
│   │   ├── Settings.tsx
│   │   ├── admin/            # Admin pages
│   │   └── static/           # Privacy, Terms, etc.
│   │
│   ├── store/                # Zustand stores
│   │   └── authStore.ts
│   │
│   ├── types/                # TypeScript definitions
│   │   └── index.ts
│   │
│   ├── utils/                # Utility functions
│   │   ├── formatters.ts     # Currency, date, number formatting
│   │   ├── validators.ts     # PAN, GST, RERA validation
│   │   └── constants.ts      # App-wide constants
│   │
│   ├── App.tsx               # Main app with routing
│   ├── main.tsx              # Entry point
│   └── index.css             # Global styles + Tailwind
│
├── public/                   # Static assets
├── index.html
├── package.json
├── tsconfig.json
├── vite.config.ts
└── tailwind.config.js
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. **Clone the repository**
   ```bash
   cd d:\shalinii\ipnl_website\frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start development server**
   ```bash
   npm run dev
   ```

4. **Open browser**
   Navigate to `http://localhost:3000`

### Build for Production

```bash
npm run build
npm run preview  # Preview production build
```

---

## 🔑 Key Features

### User Features
- **Browse Marketplace** – View exclusive off-market mandates
- **Post Mandates** – Create buy/sell listings with detailed information
- **Introduction System** – Request introductions to mandate owners (quota-based)
- **Real-time Messaging** – Direct messaging after successful introductions
- **Leaderboard** – Reputation scoring based on activity
- **Notifications** – Real-time updates via Socket.io

### Admin Features
- **KYC Queue** – Review and approve PAN, GST, RERA documents
- **User Management** – Suspend, activate, tier upgrades
- **Mandate Moderation** – Hide/unhide inappropriate listings
- **Platform Analytics** – User stats, revenue, activity metrics
- **Audit Logs** – Full trail of admin actions

---

## 🎨 Design System

### Color Palette (Dark Theme)
- **Background**: Near-black (`hsl(0 0% 7%)`)
- **Foreground**: White (`hsl(0 0% 98%)`)
- **Primary**: Gold/Amber (`hsl(38 92% 50%)`)
- **Card**: Dark gray (`hsl(0 0% 10%)`)
- **Border**: Subtle gray (`hsl(0 0% 20%)`)

### Typography
- Font: System UI stack
- Headings: Bold, clear hierarchy
- Body: Medium weight, readable line height

---

## 🔒 Security & Compliance

### Authentication
- JWT-based authentication
- Token stored in localStorage
- Auto-refresh mechanism
- Protected routes with guards

### RERA Compliance
- RERA number verification for brokers
- Project registration validation
- Audit trails for all transactions
- Compliance reporting

### Data Protection
- KYC documents encrypted in storage
- Secure API communication
- No exposure of sensitive user data
- GDPR-style privacy controls

---

## 📡 API Integration

### Base Configuration
```typescript
// src/api/client.ts
const apiClient = axios.create({
  baseURL: '/api',  // Proxied to localhost:4000 in dev
  timeout: 30000,
});
```

### API Response Format
```typescript
{
  data: T,           // Actual response data
  meta?: {           // Pagination metadata
    total: number,
    page: number,
    limit: number,
    totalPages: number
  },
  error?: {          // RFC 7807 Problem Details
    type: string,
    title: string,
    status: number,
    detail: string
  }
}
```

---

## 🧪 Development Guidelines

### Code Style
- **TypeScript strict mode** enabled
- **No `any` types** – use proper interfaces
- **Functional components** with hooks
- **Named exports** preferred

### State Management
- **React Query** for server state
- **Zustand** for client state (auth)
- **No prop drilling** – use context or queries

### Component Structure
```tsx
// 1. Imports
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';

// 2. Types/Interfaces
interface Props { ... }

// 3. Component
export default function ComponentName({ prop }: Props) {
  // 4. Hooks
  const [state, setState] = useState();
  const { data } = useQuery(...);
  
  // 5. Handlers
  const handleClick = () => { ... };
  
  // 6. Render
  return <div>...</div>;
}
```

---

## 🔄 Real-time Features

### Socket.io Integration
```typescript
// Automatic connection when authenticated
useSocket();  // In App.tsx

// Events received
- message:new          → New message in conversation
- notification:new     → New notification
- intro:received       → Introduction request
- intro:responded      → Introduction response
- mandate:updated      → Mandate status change
```

### Browser Notifications
- Automatic permission request on first load
- Desktop notifications for key events
- Badge counts for unread items

---

## 📦 Dependencies

### Core
- `react` `react-dom` - UI library
- `react-router-dom` - Routing
- `@tanstack/react-query` - Server state
- `zustand` - Client state
- `axios` - HTTP client
- `socket.io-client` - Real-time

### UI Components
- `@radix-ui/*` - Unstyled primitives
- `tailwindcss` - Utility-first CSS
- `class-variance-authority` - Component variants
- `lucide-react` - Icons

### Utilities
- `date-fns` - Date formatting
- `react-hook-form` - Form handling
- `zod` - Schema validation

---

## 🚧 Roadmap

### Phase 1: MVP (Current)
- ✅ Frontend application structure
- ✅ User authentication & KYC
- ✅ Mandate marketplace
- ✅ Introduction system
- ✅ Messaging
- ⏳ Backend API implementation

### Phase 2: Enhancement
- Advanced search & filters
- Saved searches & alerts
- Team accounts (Enterprise)
- Mobile responsive improvements
- Performance optimization

### Phase 3: Scale
- Mobile apps (React Native)
- Advanced analytics dashboard
- AI-powered mandate recommendations
- Integration with property databases
- Multi-language support

---

## 📄 License

Proprietary - India Property Networks © 2026

---

## 📞 Support

- **Email**: support@indiapropertynetworks.com
- **Phone**: +91 22 1234 5678
- **Website**: [indiapropertynetworks.com](https://indiapropertynetworks.com)

---

Built with ❤️ for India's real estate professionals
