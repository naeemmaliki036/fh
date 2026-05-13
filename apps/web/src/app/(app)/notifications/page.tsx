import { Activity } from "lucide-react";

export default function NotificationsPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Activity className="h-5 w-5 text-muted-foreground" />
        <h1 className="text-xl font-semibold">All Notifications</h1>
      </div>
      <p className="text-sm text-muted-foreground">
        Full activity feed coming soon.
      </p>
    </div>
  );
}
