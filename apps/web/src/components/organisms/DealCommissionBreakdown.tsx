"use client";

import { formatAed } from "@/lib/utils/format-currency";
import type { Deal } from "@/lib/types/deal";

interface Row {
  label: string;
  value: string;
  highlight?: boolean;
  badge?: React.ReactNode;
}

function BreakdownRow({ label, value, highlight, badge }: Row): React.ReactElement {
  return (
    <div
      className={`grid grid-cols-2 gap-2 py-2 border-b last:border-0 ${
        highlight ? "font-semibold text-primary" : ""
      }`}
    >
      <span className="text-sm flex items-center gap-1.5">
        {label}
        {badge}
      </span>
      <span className="text-sm text-right">{value}</span>
    </div>
  );
}

interface DealCommissionBreakdownProps {
  deal: Deal;
}

function computeBreakdown(deal: Deal): {
  transactionValue: number;
  companyCommission: number;
  agentPayout: number;
  companyNet: number;
  commissionLabel: string;
  agentShareLabel: string;
} | null {
  const agent = deal.primary_agent;
  if (!agent) return null;

  const txValue = Number(deal.transaction_value);
  const commValue = Number(deal.commission_value);

  // Company commission earned
  let companyCommission: number;
  let commissionLabel: string;
  if (deal.commission_type === "percentage") {
    companyCommission = (commValue / 100) * txValue;
    commissionLabel = `Company commission (${commValue}%)`;
  } else {
    companyCommission = commValue;
    commissionLabel = "Company commission (fixed)";
  }

  // Agent payout
  const agentCommType = agent.default_commission_type;
  const agentCommValue = Number(agent.default_commission_value);

  let agentPayout: number;
  let agentShareLabel: string;
  if (agentCommType === "percentage") {
    agentPayout = (agentCommValue / 100) * companyCommission;
    agentShareLabel = `Agent share (${agentCommValue}%)`;
  } else {
    agentPayout = agentCommValue;
    agentShareLabel = "Agent payout (fixed)";
  }

  return {
    transactionValue: txValue,
    companyCommission,
    agentPayout,
    companyNet: companyCommission - agentPayout,
    commissionLabel,
    agentShareLabel,
  };
}

export function DealCommissionBreakdown({ deal }: DealCommissionBreakdownProps): React.ReactElement {
  const breakdown = computeBreakdown(deal);

  if (!breakdown) {
    return (
      <p className="text-sm text-muted-foreground italic">
        No agent data available for breakdown.
      </p>
    );
  }

  const overrideBadge = deal.commission_overridden ? (
    <span className="inline-block text-xs bg-amber-100 text-amber-800 rounded px-1.5 py-0.5 dark:bg-amber-900/40 dark:text-amber-300">
      Override applied
    </span>
  ) : undefined;

  return (
    <div className="rounded-xl border bg-card p-4 space-y-0">
      <BreakdownRow
        label="Transaction value"
        value={formatAed(breakdown.transactionValue)}
      />
      <BreakdownRow
        label={breakdown.commissionLabel}
        value={formatAed(Math.round(breakdown.companyCommission))}
        badge={overrideBadge}
      />
      <BreakdownRow
        label={breakdown.agentShareLabel}
        value={formatAed(Math.round(breakdown.agentPayout))}
        highlight
      />
      <BreakdownRow
        label="Company keeps"
        value={formatAed(Math.round(breakdown.companyNet))}
      />
    </div>
  );
}
