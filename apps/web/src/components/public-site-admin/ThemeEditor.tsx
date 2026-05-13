import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ConfigFormValues } from "./types";

interface ColorFieldProps {
  label: string;
  name: "theme.primary_color" | "theme.accent_color";
  control: Control<ConfigFormValues>;
  placeholder: string;
}

function ColorField({ label, name, control, placeholder }: ColorFieldProps): React.ReactElement {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      <Controller
        control={control}
        name={name}
        render={({ field, fieldState }) => (
          <>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={field.value ?? placeholder}
                onChange={(e) => field.onChange(e.target.value)}
                className="h-9 w-12 cursor-pointer rounded-md border p-0.5"
              />
              <Input
                value={field.value ?? ""}
                onChange={(e) => field.onChange(e.target.value || null)}
                placeholder={placeholder}
                className="font-mono uppercase"
                maxLength={7}
              />
              <span
                className="h-9 w-9 shrink-0 rounded-md border"
                style={{ backgroundColor: field.value ?? placeholder }}
              />
            </div>
            {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
          </>
        )}
      />
    </div>
  );
}

interface ThemeEditorProps {
  control: Control<ConfigFormValues>;
}

export function ThemeEditor({ control }: ThemeEditorProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <ColorField label="Primary color" name="theme.primary_color" control={control} placeholder="#020617" />
      <ColorField label="Accent color" name="theme.accent_color" control={control} placeholder="#b45309" />
      <p className="text-xs text-muted-foreground">Primary is used for buttons and headers. Accent is used for badges and eyebrow labels.</p>
    </div>
  );
}
