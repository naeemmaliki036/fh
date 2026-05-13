import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ConfigFormValues } from "./types";

interface ContactEditorProps {
  control: Control<ConfigFormValues>;
}

export function ContactEditor({ control }: ContactEditorProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Section eyebrow</Label>
        <Controller
          control={control}
          name="contact.title"
          render={({ field }) => (
            <Input {...field} value={field.value ?? ""} placeholder="Get started" maxLength={80} />
          )}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Headline</Label>
        <Controller
          control={control}
          name="contact.headline"
          render={({ field }) => (
            <Input {...field} value={field.value ?? ""} placeholder="Ready to buy, rent, sell, or list?" maxLength={200} />
          )}
        />
      </div>
      <div className="space-y-1.5">
        <Label>WhatsApp number</Label>
        <Controller
          control={control}
          name="contact.whatsapp"
          render={({ field, fieldState }) => (
            <>
              <Input {...field} value={field.value ?? ""} placeholder="+971500000000" />
              {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
            </>
          )}
        />
        <p className="text-xs text-muted-foreground">Include country code. Displays a WhatsApp button alongside the form.</p>
      </div>
    </div>
  );
}
