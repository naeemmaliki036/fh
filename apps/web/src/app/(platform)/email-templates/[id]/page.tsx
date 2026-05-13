"use client";

import { use } from "react";
import { useEmailTemplate } from "@/hooks/queries/useEmailTemplates";
import { EmailTemplateForm } from "@/components/organisms/EmailTemplateForm";

interface Props {
  params: Promise<{ id: string }>;
}

export default function EditEmailTemplatePage({ params }: Props): React.ReactElement {
  const { id } = use(params);
  const { data: template, isLoading } = useEmailTemplate(id);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground">Loading template...</p>;
  }
  if (!template) {
    return <p className="text-sm text-destructive">Template not found.</p>;
  }

  return <EmailTemplateForm template={template} />;
}
