import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';

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
import AdminAuditHistory from './pages/admin/AdminAuditHistory';
import AdminLeads from './pages/admin/AdminLeads';
import AdminContacts from './pages/admin/AdminContacts';

// Public utility pages
import PublicMandatePreview from './pages/PublicMandatePreview';

// Static Pages
import Privacy from './pages/static/Privacy';
import Terms from './pages/static/Terms';
import ReraProtocol from './pages/static/ReraProtocol';
import Contact from './pages/static/Contact';
import Pricing from './pages/Pricing';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

// Hooks & Store
import { useAuth } from './hooks/useAuth';
import { useSocket } from './hooks/useSocket';
import { useAdminAccess } from './hooks/useAdminAccess';
import { FEATURES } from './lib/features';

// Wraps protected routes: if the user isn't authenticated, redirects to
// /login and remembers the page they were trying to reach (via `location
// .state.from`) so Auth.tsx can send them back there after login.
function RequireAuth({ children }: { children: JSX.Element }) {
  const { isAuthenticated } = useAuth();
  const location = useLocation();

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/login"
        state={{ from: location.pathname + location.search }}
        replace
      />
    );
  }

  return children;
}

function App() {
  const isAdmin = useAdminAccess();
  useSocket(); // Initialize Socket.io connection

  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/mandate-preview" element={<PublicMandatePreview />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/rera-protocol" element={<ReraProtocol />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/mandates/:id" element={<MandateDetail />} />

        {/* Auth Routes */}
        <Route element={<AuthLayout />}>
          <Route path="/login" element={<Auth />} />
          <Route path="/register" element={<Auth />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
        </Route>

        {/* Protected Routes */}
        <Route element={<RequireAuth><WorkspaceLayout /></RequireAuth>}>
          <Route path="/marketplace" element={<Marketplace />} />
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
          {FEATURES.introductions && <Route path="/intros" element={<Intros />} />}

          {/* Admin Routes */}
          {isAdmin && (
            <>
              <Route path="/admin/kyc-queue" element={<KycQueue />} />
              <Route path="/admin/mandates" element={<AdminMandates />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/stats" element={<AdminStats />} />
              <Route path="/admin/audit" element={<AdminAuditHistory />} />
              <Route path="/admin/leads" element={<AdminLeads />} />
              <Route path="/admin/contacts" element={<AdminContacts />} />
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