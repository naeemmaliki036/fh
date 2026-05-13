"use client";

import { useState, type ReactElement } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { MoreHorizontal, Pencil, Send, Trash2 } from "lucide-react";
import { useEmailTemplates } from "@/hooks/queries/useEmailTemplates";
import { useDeleteEmailTemplate } from "@/hooks/mutations/useEmailTemplateMutations";
import { ConfirmDialog } from "@/components/molecules/ConfirmDialog";
import { TestSendDialog } from "@/components/molecules/TestSendDialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { EmailTemplate, EmailTemplateScope } from "@/lib/types";
import { formatDate } from "@/lib/utils/format-date";

interface FilterState {
  scope: EmailTemplateScope | "all";
  active: "all" | "true" | "false";
}

export function EmailTemplatesTable(): ReactElement {
  const router = useRouter();
  const [filters, setFilters] = useState<FilterState>({ scope: "all", active: "all" });
  const [testTarget, setTestTarget] = useState<EmailTemplate | null>(null);

  const { data, isLoading } = useEmailTemplates({
    scope: filters.scope === "all" ? undefined : filters.scope,
    active: filters.active === "all" ? undefined : filters.active === "true",
  });

  const { mutate: deleteTemplate } = useDeleteEmailTemplate();

  const templates = data?.items ?? [];

  function setScope(scope: FilterState["scope"]): void {
    setFilters((f) => ({ ...f, scope }));
  }
  function setActive(active: FilterState["active"]): void {
    setFilters((f) => ({ ...f, active }));
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        {(["all", "platform", "tenant"] as const).map((s) => (
          <Button
            key={s}
            size="sm"
            variant={filters.scope === s ? "default" : "outline"}
            onClick={() => setScope(s)}
          >
            {s === "all" ? "All scopes" : s.charAt(0).toUpperCase() + s.slice(1)}
          </Button>
        ))}
        <div className="w-px h-5 bg-border mx-1" />
        {(["all", "true", "false"] as const).map((a) => (
          <Button
            key={a}
            size="sm"
            variant={filters.active === a ? "default" : "outline"}
            onClick={() => setActive(a)}
          >
            {a === "all" ? "All" : a === "true" ? "Active" : "Inactive"}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="overflow-x-auto rounded-md border">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium">Key</th>
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Subject</th>
                <th className="px-4 py-3 text-left font-medium">Scope</th>
                <th className="px-4 py-3 text-left font-medium">Active</th>
                <th className="px-4 py-3 text-left font-medium">Updated</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    No templates found
                  </td>
                </tr>
              )}
              {templates.map((t) => (
                <tr
                  key={t.id}
                  className="border-t hover:bg-muted/30 cursor-pointer"
                  onClick={() => router.push(`/email-templates/${t.id}`)}
                >
                  <td className="px-4 py-3 font-mono text-xs">{t.key}</td>
                  <td className="px-4 py-3">{t.name}</td>
                  <td className="px-4 py-3 max-w-[220px] truncate text-muted-foreground">
                    {t.subject}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={t.scope === "platform" ? "default" : "secondary"}>
                      {t.scope}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={t.active ? "default" : "outline"}>
                      {t.active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {formatDate(t.updated_at, undefined)}
                  </td>
                  <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem asChild>
                          <Link href={`/email-templates/${t.id}`} className="flex items-center gap-2">
                            <Pencil className="h-3.5 w-3.5" />
                            Edit
                          </Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => setTestTarget(t)}
                          className="flex items-center gap-2"
                        >
                          <Send className="h-3.5 w-3.5" />
                          Test send
                        </DropdownMenuItem>
                        <ConfirmDialog
                          trigger={
                            <DropdownMenuItem
                              onSelect={(e) => e.preventDefault()}
                              className="flex items-center gap-2 text-destructive focus:text-destructive"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Delete
                            </DropdownMenuItem>
                          }
                          title="Delete template"
                          description={`Delete "${t.name}"? This cannot be undone.`}
                          confirmLabel="Delete"
                          variant="destructive"
                          onConfirm={() => deleteTemplate(t.id)}
                        />
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {testTarget && (
        <TestSendDialog
          templateId={testTarget.id}
          variables={Object.keys(testTarget.variables)}
          open={!!testTarget}
          onOpenChange={(open) => { if (!open) setTestTarget(null); }}
        />
      )}
    </div>
  );
}
