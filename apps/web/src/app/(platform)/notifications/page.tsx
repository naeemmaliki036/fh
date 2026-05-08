import { NotificationsPanel } from "@/components/organisms/NotificationsPanel";

export default function NotificationsPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Notifications</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your platform activity feed
        </p>
      </div>
      <NotificationsPanel />
    </div>
  );
}
