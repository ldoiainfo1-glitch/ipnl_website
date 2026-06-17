import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';

// Layouts
import AuthLayout from './components/layout/AuthLayout';
import WorkspaceLayout from './components/layout/WorkspaceLayout';

// Pages
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Marketplace from './pages/Marketplace';
import MandateDetail from './pages/MandateDetail';
import Dashboard from './pages/Dashboard';
import PostMandate from './pages/PostMandate';
import Messages from './pages/Messages';
import Leaderboard from './pages/Leaderboard';
import Notifications from './pages/Notifications';
import Settings from './pages/Settings';
import KycVerification from './pages/KycVerification';
import Profile from './pages/Profile';
import MemberDirectory from './pages/MemberDirectory';
import UserProfile from './pages/UserProfile';
import Intros from './pages/Intros';

// Admin Pages
import KycQueue from './pages/admin/KycQueue';
import AdminMandates from './pages/admin/AdminMandates';
import AdminUsers from './pages/admin/AdminUsers';
import AdminStats from './pages/admin/AdminStats';

// Static Pages
import Privacy from './pages/static/Privacy';
import Terms from './pages/static/Terms';
import ReraProtocol from './pages/static/ReraProtocol';
import Contact from './pages/static/Contact';
import Pricing from './pages/Pricing';

// Hooks & Store
import { useAuthStore } from './store/authStore';
import { useSocket } from './hooks/useSocket';

function App() {
  const { user, isAuthenticated } = useAuthStore();
  useSocket(); // Initialize Socket.io connection

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/rera-protocol" element={<ReraProtocol />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/pricing" element={<Pricing />} />

        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Auth />} />
          <Route path="/register" element={<Auth />} />
        </Route>

        {/* Protected Routes */}
        <Route
          element={
            isAuthenticated ? <WorkspaceLayout /> : <Navigate to="/login" replace />
          }
        >
          <Route path="/marketplace" element={<Marketplace />} />
          <Route path="/mandates/:id" element={<MandateDetail />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/post-mandate" element={<PostMandate />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="/leaderboard" element={<Leaderboard />} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/kyc" element={<KycVerification />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/members" element={<MemberDirectory />} />
          <Route path="/members/:id" element={<UserProfile />} />
          <Route path="/intros" element={<Intros />} />

          {/* Admin Routes */}
          {user?.role === 'ADMIN' && (
            <>
              <Route path="/admin/kyc-queue" element={<KycQueue />} />
              <Route path="/admin/mandates" element={<AdminMandates />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/stats" element={<AdminStats />} />
            </>
          )}
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
