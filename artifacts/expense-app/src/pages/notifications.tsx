import { 
  useListNotifications, 
  getListNotificationsQueryKey,
  useMarkNotificationRead,
  useMarkAllNotificationsRead
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Bell, Check, CheckCheck, AlertTriangle, Info, FileText, PlusCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Spinner } from "@/components/ui/spinner";
import { NotificationType } from "@workspace/api-client-react";

export default function Notifications() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const { data: notifications, isLoading } = useListNotifications();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllNotificationsRead();

  const handleMarkRead = async (id: number) => {
    try {
      await markRead.mutateAsync({ id });
      queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
    } catch (error) {
      console.error(error);
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await markAllRead.mutateAsync();
      queryClient.invalidateQueries({ queryKey: getListNotificationsQueryKey() });
      toast({ title: "All notifications marked as read" });
    } catch (error) {
      console.error(error);
    }
  };

  const getIcon = (type: NotificationType) => {
    switch (type) {
      case NotificationType.budget_alert:
        return <AlertTriangle className="h-5 w-5 text-amber-500" />;
      case NotificationType.expense_added:
        return <PlusCircle className="h-5 w-5 text-emerald-500" />;
      case NotificationType.report_ready:
        return <FileText className="h-5 w-5 text-blue-500" />;
      case NotificationType.system:
      default:
        return <Info className="h-5 w-5 text-primary" />;
    }
  };

  if (isLoading && !notifications) {
    return <Spinner className="m-auto mt-20 w-8 h-8" />;
  }

  const unreadCount = notifications?.filter(n => !n.isRead).length || 0;

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Notifications</h1>
          <p className="text-muted-foreground mt-2">
            You have {unreadCount} unread message{unreadCount !== 1 ? 's' : ''}.
          </p>
        </div>
        {unreadCount > 0 && (
          <Button variant="outline" onClick={handleMarkAllRead} className="gap-2 shrink-0" disabled={markAllRead.isPending}>
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </Button>
        )}
      </div>

      <div className="space-y-4">
        {notifications?.map((notification) => (
          <Card 
            key={notification.id} 
            className={`transition-colors ${!notification.isRead ? 'border-primary/50 bg-primary/5' : 'bg-card'}`}
          >
            <CardContent className="p-4 flex gap-4">
              <div className="mt-1 shrink-0">
                {getIcon(notification.type)}
              </div>
              <div className="flex-1 space-y-1">
                <p className={`text-sm ${!notification.isRead ? 'font-medium text-foreground' : 'text-muted-foreground'}`}>
                  {notification.message}
                </p>
                <p className="text-xs text-muted-foreground">
                  {format(new Date(notification.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </p>
              </div>
              {!notification.isRead && (
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="shrink-0"
                  onClick={() => handleMarkRead(notification.id)}
                  title="Mark as read"
                >
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </CardContent>
          </Card>
        ))}
        
        {(!notifications || notifications.length === 0) && (
          <div className="py-16 flex flex-col items-center justify-center text-center">
            <div className="bg-muted w-16 h-16 rounded-full flex items-center justify-center mb-4">
              <Bell className="h-8 w-8 text-muted-foreground" />
            </div>
            <h3 className="text-lg font-medium">All caught up!</h3>
            <p className="text-sm text-muted-foreground mt-1">
              You don't have any notifications right now.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
