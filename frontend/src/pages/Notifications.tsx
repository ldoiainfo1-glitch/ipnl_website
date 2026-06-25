import { useNavigate } from 'react-router-dom';
import { useNotifications } from '@/hooks/useNotifications';
import { useAdminAccess } from '@/hooks/useAdminAccess';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Bell, Check, Trash2 } from 'lucide-react';
import { formatRelativeTime } from '@/utils/formatters';

function getNotificationLink(
  type: string,
  relatedEntityType?: string,
  relatedEntityId?: string,
  isAdmin?: boolean
): string | null {
  if (type === 'MANDATE_POSTED') {
    if (relatedEntityId) return `/mandates/${relatedEntityId}`;
    return isAdmin ? '/admin/mandates' : '/marketplace';
  }
  if (type === 'MANDATE_UPDATED') {
    return relatedEntityId ? `/mandates/${relatedEntityId}` : '/marketplace';
  }
  if (type === 'KYC_SUBMITTED') {
    return isAdmin ? '/admin/kyc-queue' : '/kyc';
  }
  if (type === 'KYC_APPROVED' || type === 'KYC_REJECTED') {
    return '/kyc';
  }
  if (type === 'MESSAGE_RECEIVED') {
    return '/messages';
  }
  if (type === 'INTRO_RECEIVED' || type === 'INTRO_ACCEPTED' || type === 'INTRO_DECLINED') {
    return '/intros';
  }
  if (relatedEntityType === 'mandate' && relatedEntityId) {
    return `/mandates/${relatedEntityId}`;
  }
  return null;
}

export default function Notifications() {
  const navigate = useNavigate();
  const isAdmin = useAdminAccess();
  const { notifications, unreadCount, markAsRead, markAllAsRead, deleteNotification, isLoading } = useNotifications();

  function handleNotificationClick(notification: any) {
    if (!notification.isRead) {
      markAsRead(notification.id);
    }
    const link = getNotificationLink(
      notification.type,
      notification.relatedEntityType,
      notification.relatedEntityId,
      isAdmin
    );
    if (link) navigate(link);
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-muted-foreground">Loading notifications...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Notifications</h1>
          <p className="text-muted-foreground">
            {unreadCount} unread notification{unreadCount !== 1 ? 's' : ''}
          </p>
        </div>
        {unreadCount > 0 && (
          <Button onClick={() => markAllAsRead()} variant="outline">
            <Check className="w-4 h-4 mr-2" />
            Mark All Read
          </Button>
        )}
      </div>

      {notifications.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Bell className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium mb-2">No notifications</p>
            <p className="text-muted-foreground">
              You're all caught up! Check back later for updates.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification) => (
            <Card
              key={notification.id}
              className={`${
                !notification.isRead ? 'border-primary bg-primary/5' : ''
              } ${getNotificationLink(notification.type, notification.relatedEntityType, notification.relatedEntityId, isAdmin) ? 'cursor-pointer hover:bg-muted/50 transition-colors' : ''}`}
              onClick={() => handleNotificationClick(notification)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold">{notification.title}</h3>
                      {!notification.isRead && (
                        <Badge variant="default" className="text-xs">
                          New
                        </Badge>
                      )}
                    </div>
                    <p className="text-muted-foreground mb-2">
                      {notification.message}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formatRelativeTime(notification.createdAt)}
                    </p>
                  </div>
                  <div className="flex space-x-2 ml-4">
                    {!notification.isRead && (
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => { e.stopPropagation(); markAsRead(notification.id); }}
                      >
                        <Check className="w-4 h-4" />
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => { e.stopPropagation(); deleteNotification(notification.id); }}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
