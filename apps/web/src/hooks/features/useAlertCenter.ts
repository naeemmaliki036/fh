"use client";

import { useMemo, useCallback, useState, useEffect } from "react";
import { useAuditLog } from "@/hooks/queries/useAuditLog";
import { useLeads } from "@/hooks/queries/useLeads";
import { useDocumentRequests } from "@/hooks/queries/useDocumentRequests";
import { useAuth } from "@/contexts/AuthContext";
import { formatRelativeTime } from "@/lib/utils/relativeTime";
import type { AuditLog, AuditAction } from "@/lib/types/audit-log";
import type { Lead } from "@/lib/types/lead";
import type { DocumentRequest } from "@/lib/types/document-request";

const LS_KEY = "fh_notifications_last_viewed";
const AUDIT_LIMIT = 20;

export type AlertKind = "audit" | "overdue_lead" | "pending_doc_request";

export interface AlertItem {
  id: string;
  kind: AlertKind;
  action: AuditAction | "overdue_lead" | "pending_doc_request";
  title: string;
  timeAgo: string;
  createdAt: string;
  ctaHref: string | null;
  isUnread: boolean;
}

function lastViewedAt(): Date {
  if (typeof window === "undefined") return new Date(0);
  const raw = localStorage.getItem(LS_KEY);
  if (!raw) return new Date(0);
  const d = new Date(raw);
  return isNaN(d.getTime()) ? new Date(0) : d;
}

function auditTitle(e: AuditLog): string {
  const actor = e.actor?.full_name ?? e.actor?.email ?? "System";
  return `${actor}: ${e.action.replace(/_/g, " ")}`;
}

function fromAudit(entry: AuditLog, cutoff: Date): AlertItem {
  return {
    id: `audit-${entry.id}`,
    kind: "audit",
    action: entry.action,
    title: auditTitle(entry),
    timeAgo: formatRelativeTime(entry.created_at),
    createdAt: entry.created_at,
    ctaHref: null,
    isUnread: new Date(entry.created_at) > cutoff,
  };
}

function fromLead(lead: Lead, cutoff: Date): AlertItem {
  const name = lead.customer?.full_name ?? "Unknown customer";
  const at = lead.next_action_at ?? lead.updated_at;
  return {
    id: `lead-${lead.id}`,
    kind: "overdue_lead",
    action: "overdue_lead",
    title: `Overdue lead: ${name}`,
    timeAgo: formatRelativeTime(at),
    createdAt: at,
    ctaHref: `/leads`,
    isUnread: new Date(at) > cutoff,
  };
}

function fromDocRequest(dr: DocumentRequest, cutoff: Date): AlertItem {
  return {
    id: `doc-${dr.id}`,
    kind: "pending_doc_request",
    action: "pending_doc_request",
    title: `Pending document request: ${dr.title}`,
    timeAgo: formatRelativeTime(dr.created_at),
    createdAt: dr.created_at,
    ctaHref: `/document-requests`,
    isUnread: new Date(dr.created_at) > cutoff,
  };
}

export interface AlertCenterResult {
  items: AlertItem[];
  unreadCount: number;
  isLoading: boolean;
  markAllRead: () => void;
}

export function useAlertCenter(): AlertCenterResult {
  const { currentUser } = useAuth();

  const [cutoff, setCutoff] = useState<Date>(lastViewedAt);

  // Sync cutoff from localStorage on mount (avoids SSR mismatch)
  useEffect(() => {
    setCutoff(lastViewedAt());
  }, []);

  const auditQuery = useAuditLog(undefined, undefined, AUDIT_LIMIT);

  const leadsQuery = useLeads(
    currentUser?.id
      ? { assigned_agent_id: currentUser.id, limit: 20 }
      : undefined,
  );

  const docQuery = useDocumentRequests({ status: "pending", limit: 20 });

  const markAllRead = useCallback((): void => {
    const now = new Date();
    if (typeof window !== "undefined") {
      localStorage.setItem(LS_KEY, now.toISOString());
    }
    setCutoff(now);
  }, []);

  const items = useMemo((): AlertItem[] => {
    const now = Date.now();
    const auditItems = (auditQuery.data?.items ?? []).map((e) =>
      fromAudit(e, cutoff),
    );

    const overdueLeads = (leadsQuery.data?.items ?? [])
      .filter((l) => {
        if (!l.next_action_at) return false;
        return new Date(l.next_action_at).getTime() < now;
      })
      .map((l) => fromLead(l, cutoff));

    const pendingDocs = (docQuery.data?.items ?? []).map((dr) =>
      fromDocRequest(dr, cutoff),
    );

    const all = [...auditItems, ...overdueLeads, ...pendingDocs];
    all.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
    );
    return all.slice(0, 30);
  }, [auditQuery.data, leadsQuery.data, docQuery.data, cutoff]);

  const unreadCount = useMemo(
    () => items.filter((i) => i.isUnread).length,
    [items],
  );

  const isLoading =
    auditQuery.isLoading || leadsQuery.isLoading || docQuery.isLoading;

  return { items, unreadCount, isLoading, markAllRead };
}
