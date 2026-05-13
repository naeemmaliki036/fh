import type { Control } from "react-hook-form";
import { Controller } from "react-hook-form";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { ConfigFormValues } from "./types";

interface FooterEditorProps {
  control: Control<ConfigFormValues>;
}

export function FooterEditor({ control }: FooterEditorProps): React.ReactElement {
  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Footer description</Label>
        <Controller
          control={control}
          name="footer.description"
          render={({ field }) => (
            <Input {...field} value={field.value ?? ""} placeholder="A modern real estate platform..." maxLength={500} />
          )}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Office address</Label>
        <Controller
          control={control}
          name="footer.address"
          render={({ field }) => (
            <Input {...field} value={field.value ?? ""} placeholder="123 Business Bay, Dubai" maxLength={200} />
          )}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Instagram URL</Label>
        <Controller
          control={control}
          name="footer.instagram_url"
          render={({ field, fieldState }) => (
            <>
              <Input {...field} value={field.value ?? ""} placeholder="https://instagram.com/yourhandle" />
              {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
            </>
          )}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Facebook URL</Label>
        <Controller
          control={control}
          name="footer.facebook_url"
          render={({ field, fieldState }) => (
            <>
              <Input {...field} value={field.value ?? ""} placeholder="https://facebook.com/yourpage" />
              {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
            </>
          )}
        />
      </div>
      <div className="space-y-1.5">
        <Label>LinkedIn URL</Label>
        <Controller
          control={control}
          name="footer.linkedin_url"
          render={({ field, fieldState }) => (
            <>
              <Input {...field} value={field.value ?? ""} placeholder="https://linkedin.com/company/yourco" />
              {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
            </>
          )}
        />
      </div>
    </div>
  );
}
