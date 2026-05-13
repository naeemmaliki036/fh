import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import type { ConfigFormValues } from "./types";

interface SectionsEditorProps {
  control: Control<ConfigFormValues>;
}

interface ToggleRowProps {
  label: string;
  description: string;
  name: "sections.services_enabled" | "sections.team_enabled" | "sections.contact_enabled";
  control: Control<ConfigFormValues>;
}

function ToggleRow({ label, description, name, control }: ToggleRowProps): React.ReactElement {
  return (
    <div className="flex items-center justify-between gap-4">
      <div>
        <Label>{label}</Label>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <ToggleSwitch checked={field.value} onCheckedChange={field.onChange} />
        )}
      />
    </div>
  );
}

export function SectionsEditor({ control }: SectionsEditorProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <ToggleRow
        label="Services section"
        description="Show the 4-card services grid on the homepage."
        name="sections.services_enabled"
        control={control}
      />
      <ToggleRow
        label="Team section"
        description="Show the team / agents grid on the homepage."
        name="sections.team_enabled"
        control={control}
      />
      <ToggleRow
        label="Contact section"
        description="Show the contact form panel on the homepage."
        name="sections.contact_enabled"
        control={control}
      />
    </div>
  );
}
