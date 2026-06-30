import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import {
  LayoutDashboard,
  Building2,
  MessageSquare,
  Bell,
  Trophy,
  Settings,
  PlusCircle,
  Users,
  CheckCircle,
  BarChart3,
  ShieldCheck,
  UserCircle,
  Handshake,
  ScrollText,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { useMyProfile } from '@/hooks/useProfile';
import { FEATURES } from '@/lib/features';

export default function Sidebar() {
  const location = useLocation();
  const { user } = useAuth();
  const { profile } = useMyProfile();
  const isAdmin = useAdminAccess();

  const navItems = [
    { icon: LayoutDashboard, label: 'Dashboard', href: '/dashboard' },
    { icon: Building2, label: 'Marketplace', href: '/marketplace' },
    { icon: Users, label: 'Members', href: '/members' },
    { icon: PlusCircle, label: 'Post Mandate', href: '/post-mandate' },
    ...(FEATURES.introductions ? [{ icon: Handshake, label: 'Introductions', href: '/intros' }] : []),
    { icon: MessageSquare, label: 'Messages', href: '/messages' },
    { icon: Trophy, label: 'Ranking', href: '/leaderboard' },
    { icon: Bell, label: 'Notifications', href: '/notifications' },
    { icon: ShieldCheck, label: 'KYC Verification', href: '/kyc' },
    { icon: UserCircle, label: 'My Profile', href: '/profile' },
    { icon: Settings, label: 'Settings', href: '/settings' },
  ];

  const adminNavItems = [
    { icon: CheckCircle, label: 'KYC Queue', href: '/admin/kyc-queue' },
    { icon: Building2, label: 'Mandates', href: '/admin/mandates' },
    { icon: Users, label: 'Users', href: '/admin/users' },
    { icon: BarChart3, label: 'Statistics', href: '/admin/stats' },
    { icon: ScrollText, label: 'Audit History', href: '/admin/audit' },
    { icon: Handshake, label: 'New Leads', href: '/admin/leads' },
  ];

  const isActive = (href: string) => location.pathname === href;

  return (
    <aside className="w-64 bg-card border-r border-border h-screen sticky top-0 flex flex-col">
      {/* Logo */}
      <div className="p-6 border-b border-border">
        <Link to="/" className="flex items-center space-x-3">
          <img 
            src="/assets/ipnl-logo.png?v=1" 
            alt="India Property Network Ltd" 
            className="h-12 w-auto"
            onError={(e) => {
              e.currentTarget.style.display = 'none';
              const fallback = e.currentTarget.nextElementSibling as HTMLElement;
              if (fallback) fallback.style.display = 'flex';
            }}
          />
          <div className="w-10 h-10 bg-primary rounded-lg items-center justify-center hidden">
            <span className="text-primary-foreground font-bold text-lg">IPN</span>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-1">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              'flex items-center space-x-3 px-3 py-2 rounded-md transition-colors',
              isActive(item.href)
                ? 'bg-primary text-primary-foreground'
                : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
            )}
          >
            <item.icon className="w-5 h-5" />
            <span className="text-sm font-medium">{item.label}</span>
          </Link>
        ))}

        {/* Admin Section */}
        {isAdmin && (
          <>
            <div className="pt-4 pb-2">
              <p className="px-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                Admin
              </p>
            </div>
            {adminNavItems.map((item) => (
              <Link
                key={item.href}
                to={item.href}
                className={cn(
                  'flex items-center space-x-3 px-3 py-2 rounded-md transition-colors',
                  isActive(item.href)
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:bg-secondary hover:text-foreground'
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Tier Badge */}
      <div className="p-4 border-t border-border">
        <div className="bg-secondary rounded-lg p-3">
          <p className="text-xs text-muted-foreground mb-1">Current Tier</p>
          <p className="text-sm font-bold text-primary">{profile?.tier || user?.tier || 'OBSERVER'}</p>
        </div>
      </div>
    </aside>
  );
}
