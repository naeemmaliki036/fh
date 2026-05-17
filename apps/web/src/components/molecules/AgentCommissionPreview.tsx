"use client";

import { useCommissionRates } from "@/hooks/queries/useCommissionRates";
import { COMMISSION_RATE_DEFAULTS } from "@/lib/types";
import type { TenantCommissionRate, TransactionType } from "@/lib/types";

// TODO: use tenant's default currency once exposed via tenant profile API
const CURRENCY = "AED";

const fmt = new Intl.NumberFormat("en-AE", {
  style: "decimal",
  minimumFractionDigits: 0,
  maximumFractionDigits: 0,
});

function formatAmount(n: number): string {
  return `${fmt.format(Math.round(n))} ${CURRENCY}`;
}

function getRate(
  rates: TenantCommissionRate[] | undefined,
  type: TransactionType,
): number {
  return rates?.find((r) => r.transaction_type === type)?.rate
    ?? COMMISSION_RATE_DEFAULTS[type];
}

interface ExampleRowProps {
  label: string;
  dealValue: number;
  companyRate: number;
  agentSharePct: number;
}

function ExampleRow({ label, dealValue, companyRate, agentSharePct }: ExampleRowProps): React.ReactElement {
  const companyEarns = dealValue * companyRate;
  const agentGets = companyEarns * (agentSharePct / 100);
  const companyKeeps = companyEarns - agentGets;

  return (
    <div className="text-sm">
      <p className="font-medium text-foreground">
        {formatAmount(dealValue)} {label}{" "}
        <span className="font-normal text-muted-foreground">
          (company rate {(companyRate * 100).toFixed(4).replace(/\.?0+$/, "")}%)
        </span>
      </p>
      <ul className="mt-1 space-y-0.5 text-muted-foreground pl-3 text-xs">
        <li>Company commission: <span className="font-mono text-foreground">{formatAmount(companyEarns)}</span></li>
        <li>
          Agent share ({agentSharePct.toFixed(2).replace(/\.?0+$/, "")}%):{" "}
          <span className="font-mono text-foreground">{formatAmount(agentGets)}</span>
        </li>
        <li>Company keeps: <span className="font-mono text-foreground">{formatAmount(companyKeeps)}</span></li>
      </ul>
    </div>
  );
}

interface AgentCommissionPreviewProps {
  /** The agent's share percentage string from form input, e.g. "40" */
  commissionValue: string;
  commissionType: string;
}

export function AgentCommissionPreview({
  commissionValue,
  commissionType,
}: AgentCommissionPreviewProps): React.ReactElement {
  const { data: rates, isLoading } = useCommissionRates();

  const agentPct = commissionType === "percentage" ? Number(commissionValue) : 0;
  const isValid = Number.isFinite(agentPct) && agentPct > 0 && agentPct <= 100;

  const saleRate = getRate(rates, "sale");
  const rentLongRate = getRate(rates, "rent_long");

  if (isLoading) {
    return (
      <div className="rounded-md border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
        Loading rates…
      </div>
    );
  }

  if (commissionType !== "percentage") {
    return <></>;
  }

  return (
    <div className="rounded-md border bg-muted/40 px-4 py-3 space-y-3">
      <p className="text-xs font-mono uppercase tracking-widest text-muted-foreground">
        Example calculations
      </p>
      {!isValid && (
        <p className="text-xs text-muted-foreground italic">
          Enter a percentage above to see live examples.
        </p>
      )}
      {isValid && (
        <>
          <ExampleRow
            label="sale"
            dealValue={2_000_000}
            companyRate={saleRate}
            agentSharePct={agentPct}
          />
          <hr className="border-border" />
          <ExampleRow
            label="long-term rent"
            dealValue={100_000}
            companyRate={rentLongRate}
            agentSharePct={agentPct}
          />
        </>
      )}
    </div>
  );
}
