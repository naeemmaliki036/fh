import { EmailOutboxTable } from "@/components/organisms/EmailOutboxTable";

export default function EmailOutboxPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Email outbox</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Monitor sent, queued, and failed emails
        </p>
      </div>
      <EmailOutboxTable />
    </div>
  );
}
