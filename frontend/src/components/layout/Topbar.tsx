import { Bell, LogOut, Menu } from 'lucide-react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useNotifications } from '@/hooks/useNotifications';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getInitials } from '@/utils/formatters';

export default function Topbar({ onMenuToggle }: { onMenuToggle?: () => void }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotifications();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="h-16 border-b border-border bg-card sticky top-0 z-10">
      <div className="h-full px-4 md:px-6 flex items-center justify-between">
        {/* Hamburger (mobile) + Page title */}
        <div className="flex items-center gap-3">
          <button
            className="md:hidden p-2 -ml-2 rounded-md text-muted-foreground hover:text-foreground"
            onClick={onMenuToggle}
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-lg md:text-xl font-semibold text-foreground">
            {getPageTitle(location.pathname)}
          </h1>
        </div>

        {/* Actions */}
        <div className="flex items-center space-x-2 md:space-x-4">
          {/* Notifications */}
          <Button
            variant="ghost"
            size="icon"
            className="relative"
            onClick={() => navigate('/notifications')}
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <Badge
                variant="destructive"
                className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              >
                {unreadCount > 9 ? '9+' : unreadCount}
              </Badge>
            )}
          </Button>

          {/* User Menu */}
          <div className="flex items-center space-x-3">
            <Avatar>
              <AvatarImage src={user?.logo} />
              <AvatarFallback className="bg-primary text-primary-foreground">
                {getInitials(user?.companyName || 'User')}
              </AvatarFallback>
            </Avatar>
            <div className="hidden md:block">
              <p className="text-sm font-medium text-foreground">
                {user?.companyName}
              </p>
              <p className="text-xs text-muted-foreground">
                {user?.email}
              </p>
            </div>
          </div>

          {/* Logout */}
          <Button
            variant="ghost"
            size="icon"
            onClick={handleLogout}
            title="Logout"
          >
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </header>
  );
}

function getPageTitle(pathname: string): string {
  const titles: Record<string, string> = {
    '/dashboard': 'Dashboard',
    '/marketplace': 'Marketplace',
    '/post-mandate': 'Post New Mandate',
    '/messages': 'Messages',
    '/leaderboard': 'Leaderboard',
    '/notifications': 'Notifications',
    '/settings': 'Settings',
    '/admin/kyc-queue': 'KYC Queue',
    '/admin/mandates': 'Manage Mandates',
    '/admin/users': 'Manage Users',
    '/admin/stats': 'Statistics',
  };
  return titles[pathname] || 'India Property Network Ltd.';
}
