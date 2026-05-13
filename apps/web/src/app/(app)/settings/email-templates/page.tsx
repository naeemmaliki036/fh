"use client";

import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { useEmailTemplates } from "@/hooks/queries/useEmailTemplates";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils/format-date";

const ADMIN_ROLES = new Set(["company_owner", "company_admin"]);

export default function TenantEmailTemplatesPage(): React.ReactElement {
  const { currentUser } = useAuth();
  const isAdmin = currentUser && ADMIN_ROLES.has(currentUser.role);

  const { data, isLoading } = useEmailTemplates({ scope: "tenant" });
  const templates = data?.items ?? [];

  if (!isAdmin) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-semibold tracking-tight">Email templates</h1>
        <p className="text-sm text-destructive">
          You do not have permission to view this page.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Email templates</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tenant-scoped email templates for your company
        </p>
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
                <th className="px-4 py-3 text-left font-medium">Active</th>
                <th className="px-4 py-3 text-left font-medium">Updated</th>
                <th className="px-4 py-3 text-left font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {templates.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                    No tenant templates found
                  </td>
                </tr>
              )}
              {templates.map((t) => (
                <tr key={t.id} className="border-t hover:bg-muted/30">
                  <td className="px-4 py-3 font-mono text-xs">{t.key}</td>
                  <td className="px-4 py-3">{t.name}</td>
                  <td className="px-4 py-3 max-w-[200px] truncate text-muted-foreground">
                    {t.subject}
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={t.active ? "default" : "outline"}>
                      {t.active ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                    {formatDate(t.updated_at, undefined)}
                  </td>
                  <td className="px-4 py-3">
                    <Button size="sm" variant="outline" asChild>
                      <Link href={`/email-templates/${t.id}`}>Edit</Link>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
