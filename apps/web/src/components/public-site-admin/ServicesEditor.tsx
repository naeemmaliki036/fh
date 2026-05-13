import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import type { ConfigFormValues } from "./types";

interface ServicesEditorProps {
  control: Control<ConfigFormValues>;
}

const CARD_INDICES = [0, 1, 2, 3] as const;

export function ServicesEditor({ control }: ServicesEditorProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Label>Show services section</Label>
        <Controller
          control={control}
          name="services.enabled"
          render={({ field }) => (
            <ToggleSwitch checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Section title</Label>
        <Controller
          control={control}
          name="services.title"
          render={({ field }) => (
            <Input {...field} value={field.value ?? ""} placeholder="What we offer" maxLength={120} />
          )}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Section subtitle</Label>
        <Controller
          control={control}
          name="services.subtitle"
          render={({ field }) => (
            <Input {...field} value={field.value ?? ""} placeholder="Everything for modern real estate deals." maxLength={300} />
          )}
        />
      </div>
      <p className="text-xs font-medium text-muted-foreground">Service cards (exactly 4)</p>
      {CARD_INDICES.map((i) => (
        <div key={i} className="space-y-2 rounded-lg border p-3">
          <p className="text-xs font-semibold text-muted-foreground">Card {i + 1}</p>
          <Controller
            control={control}
            name={`services.cards.${i}.title`}
            render={({ field, fieldState }) => (
              <div className="space-y-1">
                <Label className="text-xs">Title</Label>
                <Input {...field} value={field.value ?? ""} maxLength={80} />
                {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
              </div>
            )}
          />
          <Controller
            control={control}
            name={`services.cards.${i}.description`}
            render={({ field, fieldState }) => (
              <div className="space-y-1">
                <Label className="text-xs">Description</Label>
                <Input {...field} value={field.value ?? ""} maxLength={300} />
                {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
              </div>
            )}
          />
        </div>
      ))}
    </div>
  );
}
