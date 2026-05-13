import Link from "next/link";
import { Button } from "@/components/ui/button";
import { EmailTemplatesTable } from "@/components/organisms/EmailTemplatesTable";

export default function EmailTemplatesPage(): React.ReactElement {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Email templates</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage platform and tenant email templates
          </p>
        </div>
        <Button asChild>
          <Link href="/email-templates/new">New template</Link>
        </Button>
      </div>
      <EmailTemplatesTable />
    </div>
  );
}
