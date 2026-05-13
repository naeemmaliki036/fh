import type { Control } from "react-hook-form";
import { Controller, useFieldArray } from "react-hook-form";
import { Trash2, Plus } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { ToggleSwitch } from "@/components/ui/toggle-switch";
import type { ConfigFormValues } from "./types";

interface TeamEditorProps {
  control: Control<ConfigFormValues>;
}

const BLANK_MEMBER = {
  name: "",
  title: "",
  photo_url: "",
  phone: "",
  email: "",
  linkedin_url: "",
};

export function TeamEditor({ control }: TeamEditorProps): React.ReactElement {
  const { fields, append, remove } = useFieldArray({ control, name: "team.members" });

  return (
    <div className="space-y-4">
      <div className="space-y-1.5">
        <Label>Section heading</Label>
        <Controller
          control={control}
          name="team.title"
          render={({ field }) => (
            <Input {...field} value={field.value ?? ""} placeholder="Meet the team" maxLength={120} />
          )}
        />
      </div>
      <div className="space-y-1.5">
        <Label>Section subheading</Label>
        <Controller
          control={control}
          name="team.subtitle"
          render={({ field }) => (
            <Input {...field} value={field.value ?? ""} placeholder="Expert team members ready to guide you." maxLength={300} />
          )}
        />
      </div>
      <div className="flex items-center justify-between gap-4">
        <div>
          <Label>Show all agents</Label>
          <p className="text-xs text-muted-foreground">Append agents from your roster after the team members above.</p>
        </div>
        <Controller
          control={control}
          name="team.show_agents"
          render={({ field }) => (
            <ToggleSwitch checked={field.value} onCheckedChange={field.onChange} />
          )}
        />
      </div>

      <div className="space-y-3">
        <p className="text-xs font-medium text-muted-foreground">Team members ({fields.length}/30)</p>
        {fields.map((f, i) => (
          <div key={f.id} className="space-y-2 rounded-lg border p-3">
            <div className="flex items-center justify-between">
              <p className="text-xs font-semibold text-muted-foreground">Member {i + 1}</p>
              <button type="button" onClick={() => remove(i)} className="text-muted-foreground hover:text-destructive transition-colors">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <div className="grid gap-2 sm:grid-cols-2">
              <Controller
                control={control}
                name={`team.members.${i}.name`}
                render={({ field, fieldState }) => (
                  <div className="space-y-1">
                    <Label className="text-xs">Name *</Label>
                    <Input {...field} maxLength={120} />
                    {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
                  </div>
                )}
              />
              <Controller
                control={control}
                name={`team.members.${i}.title`}
                render={({ field, fieldState }) => (
                  <div className="space-y-1">
                    <Label className="text-xs">Title *</Label>
                    <Input {...field} placeholder="Property Advisor" maxLength={120} />
                    {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
                  </div>
                )}
              />
              <Controller
                control={control}
                name={`team.members.${i}.phone`}
                render={({ field }) => (
                  <div className="space-y-1">
                    <Label className="text-xs">Phone</Label>
                    <Input {...field} value={field.value ?? ""} placeholder="+971 50 000 0000" />
                  </div>
                )}
              />
              <Controller
                control={control}
                name={`team.members.${i}.email`}
                render={({ field }) => (
                  <div className="space-y-1">
                    <Label className="text-xs">Email</Label>
                    <Input {...field} value={field.value ?? ""} type="email" />
                  </div>
                )}
              />
            </div>
            <Controller
              control={control}
              name={`team.members.${i}.photo_url`}
              render={({ field, fieldState }) => (
                <div className="space-y-1">
                  <Label className="text-xs">Photo URL (https)</Label>
                  <Input {...field} value={field.value ?? ""} placeholder="https://example.com/photo.jpg" />
                  {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
                </div>
              )}
            />
            <Controller
              control={control}
              name={`team.members.${i}.linkedin_url`}
              render={({ field, fieldState }) => (
                <div className="space-y-1">
                  <Label className="text-xs">LinkedIn URL (https)</Label>
                  <Input {...field} value={field.value ?? ""} placeholder="https://linkedin.com/in/username" />
                  {fieldState.error && <p className="text-xs text-destructive">{fieldState.error.message}</p>}
                </div>
              )}
            />
          </div>
        ))}

        {fields.length < 30 && (
          <Button type="button" variant="outline" size="sm" onClick={() => append(BLANK_MEMBER)}>
            <Plus className="mr-1.5 h-4 w-4" />Add member
          </Button>
        )}
      </div>
    </div>
  );
}
