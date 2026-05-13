// ── Email Template ─────────────────────────────────────────────────────────────

export type EmailTemplateScope = "platform" | "tenant";

export interface EmailTemplate {
  id: string;
  tenant_id: string | null;
  key: string;
  name: string;
  subject: string;
  body_html: string;
  body_text: string | null;
  variables: Record<string, string>;
  active: boolean;
  scope: EmailTemplateScope;
  created_at: string;
  updated_at: string;
}

export interface EmailTemplateCreateRequest {
  tenant_id: string | null;
  key: string;
  name: string;
  subject: string;
  body_html: string;
  body_text?: string | null;
  variables: Record<string, string>;
  active: boolean;
}

export interface EmailTemplateUpdateRequest {
  name?: string;
  subject?: string;
  body_html?: string;
  body_text?: string | null;
  variables?: Record<string, string>;
  active?: boolean;
}

export interface EmailTemplateListParams {
  scope?: EmailTemplateScope;
  active?: boolean;
}

export interface EmailTemplateListResponse {
  items: EmailTemplate[];
  total: number;
}

export interface TestSendRequest {
  to_email: string;
  variables: Record<string, string>;
}

export interface TestSendResponse {
  subject_rendered: string;
  body_html_rendered: string;
  body_text_rendered: string | null;
}

// ── Email Outbox ───────────────────────────────────────────────────────────────

export type EmailOutboxStatus = "queued" | "sent" | "delivered" | "bounced" | "failed";

export interface EmailOutboxItem {
  id: string;
  tenant_id: string | null;
  template_key: string;
  recipient_email: string;
  subject_rendered: string;
  body_html_rendered: string | null;
  body_text_rendered: string | null;
  status: EmailOutboxStatus;
  attempts: number;
  last_error: string | null;
  payload_json: Record<string, unknown> | null;
  queued_at: string;
  sent_at: string | null;
  delivered_at: string | null;
}

export interface EmailOutboxListParams {
  status?: EmailOutboxStatus;
  tenant_id?: string;
  from?: string;
  to?: string;
  limit?: number;
  q?: string;
}

export interface EmailOutboxListResponse {
  items: EmailOutboxItem[];
  total: number;
}

export interface ProcessOutboxResponse {
  sent: number;
  failed: number;
}
