import { CalendarView } from "@/components/organisms/CalendarView";

export default function CalendarPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Calendar</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Visualize and manage lead follow-up actions
        </p>
      </div>
      <CalendarView />
    </div>
  );
}
