"use client";

import { useRef, useState, useEffect, type ReactElement } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { VariableChipsEditor } from "@/components/molecules/VariableChipsEditor";
import { AvailableVariablesPanel } from "@/components/molecules/AvailableVariablesPanel";
import { TestSendDialog } from "@/components/molecules/TestSendDialog";
import {
  useCreateEmailTemplate,
  useUpdateEmailTemplate,
} from "@/hooks/mutations/useEmailTemplateMutations";
import type { EmailTemplate } from "@/lib/types";

const schema = z.object({
  key: z
    .string()
    .min(1, "Required")
    .regex(/^[a-z0-9]+([_-][a-z0-9]+)*$/, "Must be snake_case or kebab-case"),
  name: z.string().min(1, "Required"),
  subject: z.string().min(1, "Required"),
  body_html: z.string().min(1, "Required"),
  body_text: z.string().optional(),
  active: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface EmailTemplateFormProps {
  template?: EmailTemplate;
  forcedScope?: "platform" | "tenant";
  forcedTenantId?: string | null;
}

export function EmailTemplateForm({
  template,
  forcedScope,
  forcedTenantId,
}: EmailTemplateFormProps): ReactElement {
  const router = useRouter();
  const isEdit = !!template;
  const [variables, setVariables] = useState<string[]>(
    template ? Object.keys(template.variables) : [],
  );
  const [testOpen, setTestOpen] = useState(false);
  const [savedId, setSavedId] = useState<string | undefined>(template?.id);
  const subjectRef = useRef<HTMLInputElement | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    control,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      key: template?.key ?? "",
      name: template?.name ?? "",
      subject: template?.subject ?? "",
      body_html: template?.body_html ?? "",
      body_text: template?.body_text ?? "",
      active: template?.active ?? true,
    },
  });

  const { mutate: create, isPending: creating } = useCreateEmailTemplate();
  const { mutate: update, isPending: updating } = useUpdateEmailTemplate(template?.id ?? "");

  const isPending = creating || updating;

  function insertVar(varName: string): void {
    const token = `{${varName}}`;
    const body = bodyRef.current;
    if (body) {
      const start = body.selectionStart ?? body.value.length;
      const end = body.selectionEnd ?? body.value.length;
      const newVal = body.value.slice(0, start) + token + body.value.slice(end);
      setValue("body_html", newVal, { shouldDirty: true });
      requestAnimationFrame(() => {
        body.focus();
        body.setSelectionRange(start + token.length, start + token.length);
      });
    } else if (subjectRef.current) {
      const inp = subjectRef.current;
      const start = inp.selectionStart ?? inp.value.length;
      const newVal = inp.value.slice(0, start) + token + inp.value.slice(inp.selectionEnd ?? start);
      setValue("subject", newVal, { shouldDirty: true });
    }
  }

  function buildVariablesDict(vars: string[]): Record<string, string> {
    return Object.fromEntries(vars.map((v) => [v, ""]));
  }

  function onSubmit(values: FormValues): void {
    const scope = forcedScope ?? "platform";
    const tenant_id = forcedTenantId !== undefined ? forcedTenantId : null;
    const vars = buildVariablesDict(variables);

    if (isEdit && template) {
      update(
        {
          name: values.name,
          subject: values.subject,
          body_html: values.body_html,
          body_text: values.body_text || null,
          variables: vars,
          active: values.active,
        },
        {
          onSuccess: () => {
            setSavedId(template.id);
          },
        },
      );
    } else {
      create(
        {
          tenant_id,
          key: values.key,
          name: values.name,
          subject: values.subject,
          body_html: values.body_html,
          body_text: values.body_text || null,
          variables: vars,
          active: values.active,
          // scope is derived from tenant_id being null or not on the backend
        },
        {
          onSuccess: (created) => {
            setSavedId(created.id);
            router.replace(`/email-templates/${created.id}`);
          },
        },
      );
    }
  }

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_280px]">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">
            {isEdit ? "Edit template" : "New template"}
          </h1>
          <div className="flex gap-2">
            {savedId && (
              <Button
                type="button"
                variant="outline"
                onClick={() => setTestOpen(true)}
              >
                Test send
              </Button>
            )}
            <Button type="submit" disabled={isPending}>
              {isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        </div>

        {!isEdit && !forcedScope && (
          <Controller
            name="active"
            control={control}
            render={({ field }) => (
              <div className="flex items-center gap-3 rounded-md border p-3">
                <span className="text-sm font-medium">Scope: Platform</span>
                <span className="text-xs text-muted-foreground">(tenant_id = null)</span>
                <label className="ml-auto flex items-center gap-2 text-sm cursor-pointer">
                  <input
                    type="checkbox"
                    checked={field.value}
                    onChange={(e) => field.onChange(e.target.checked)}
                    className="rounded"
                  />
                  Active
                </label>
              </div>
            )}
          />
        )}

        {(isEdit || forcedScope) && (
          <Controller
            name="active"
            control={control}
            render={({ field }) => (
              <label className="flex items-center gap-2 text-sm cursor-pointer w-fit">
                <input
                  type="checkbox"
                  checked={field.value}
                  onChange={(e) => field.onChange(e.target.checked)}
                  className="rounded"
                />
                Active
              </label>
            )}
          />
        )}

        <div className="space-y-1">
          <Label>Key</Label>
          <Input
            {...register("key")}
            placeholder="welcome_email or welcome-email"
            disabled={isEdit}
            className={isEdit ? "bg-muted cursor-not-allowed" : ""}
          />
          {errors.key && <p className="text-xs text-destructive">{errors.key.message}</p>}
        </div>

        <div className="space-y-1">
          <Label>Name</Label>
          <Input {...register("name")} placeholder="Welcome Email" />
          {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
        </div>

        <div className="space-y-1">
          <Label>Subject</Label>
          <Input
            {...register("subject")}
            ref={(el) => {
              register("subject").ref(el);
              subjectRef.current = el;
            }}
            placeholder="Welcome, {first_name}!"
          />
          {errors.subject && <p className="text-xs text-destructive">{errors.subject.message}</p>}
        </div>

        <div className="space-y-1">
          <Label>Body HTML</Label>
          <textarea
            {...register("body_html")}
            ref={(el) => {
              register("body_html").ref(el);
              bodyRef.current = el;
            }}
            rows={14}
            placeholder="<p>Hello {first_name},</p>"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          />
          {errors.body_html && (
            <p className="text-xs text-destructive">{errors.body_html.message}</p>
          )}
        </div>

        <div className="space-y-1">
          <Label>Body text (optional)</Label>
          <textarea
            {...register("body_text")}
            rows={5}
            placeholder="Plain text fallback"
            className="w-full rounded-md border bg-background px-3 py-2 text-sm font-mono leading-relaxed focus:outline-none focus:ring-2 focus:ring-ring resize-y"
          />
        </div>

        <div className="space-y-1">
          <Label>Variables</Label>
          <VariableChipsEditor value={variables} onChange={setVariables} />
          <p className="text-xs text-muted-foreground">
            Press Enter or comma to add. Use these names in subject / body as {"{varname}"}.
          </p>
        </div>
      </form>

      <aside className="space-y-4 pt-[68px]">
        <AvailableVariablesPanel variables={variables} onInsert={insertVar} />
      </aside>

      {savedId && (
        <TestSendDialog
          templateId={savedId}
          variables={variables}
          open={testOpen}
          onOpenChange={setTestOpen}
        />
      )}
    </div>
  );
}
