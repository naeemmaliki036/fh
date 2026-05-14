"use client";

import { CheckCircle, Circle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAdminConfirmDeal, useAgentConfirmDeal } from "@/hooks/mutations/useDealMutations";
import { useAuth } from "@/contexts/AuthContext";
import type { Deal } from "@/lib/types/deal";

interface DealHandshakePanelProps {
  deal: Deal;
  onRecordPayout: () => void;
}

function Step({
  label,
  date,
  done,
}: {
  label: string;
  date: string | null;
  done: boolean;
}): React.ReactElement {
  return (
    <div className="flex items-start gap-3">
      {done
        ? <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
        : <Circle className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />}
      <div>
        <p className="text-sm font-medium">{label}</p>
        {date && (
          <p className="text-xs text-muted-foreground">
            {new Date(date).toLocaleDateString("en-AE", { day: "numeric", month: "short", year: "numeric" })}
          </p>
        )}
      </div>
    </div>
  );
}

const ADMIN_ROLES = new Set(["company_owner", "company_admin"]);

export function DealHandshakePanel({ deal, onRecordPayout }: DealHandshakePanelProps): React.ReactElement {
  const { currentUser } = useAuth();
  const { mutate: adminConfirm, isPending: confirming } = useAdminConfirmDeal(deal.id);
  const { mutate: agentConfirm, isPending: acknowledging } = useAgentConfirmDeal(deal.id);

  const isAdmin = currentUser && ADMIN_ROLES.has(currentUser.role);
  const isInvolvedAgent =
    currentUser &&
    (deal.primary_agent_id === currentUser.id ||
      (deal.secondary_agent_id && deal.secondary_agent_id === currentUser.id));

  const isClosedWon = deal.stage === "closed_won";
  const canAdminConfirm = isAdmin && isClosedWon && !deal.admin_confirmed_at;
  const canAgentConfirm = isInvolvedAgent && !!deal.admin_confirmed_at && !deal.agent_confirmed_at;
  const payoutReady = !!deal.agent_confirmed_at;
  const isPaid = deal.commission_payout_status === "paid";

  const bannerText = (): string => {
    if (isPaid) return "Commission paid";
    if (payoutReady) return "Ready for payout";
    if (deal.admin_confirmed_at) return "Awaiting agent acknowledgment";
    if (isClosedWon) return "Awaiting admin confirmation";
    return "Deal not yet closed";
  };

  const bannerColor = (): string => {
    if (isPaid) return "bg-green-50 border-green-200 text-green-800";
    if (payoutReady) return "bg-blue-50 border-blue-200 text-blue-800";
    if (deal.admin_confirmed_at) return "bg-amber-50 border-amber-200 text-amber-800";
    return "bg-muted border-border text-muted-foreground";
  };

  return (
    <div className="space-y-6">
      <div className={`rounded-md border px-4 py-3 text-sm font-medium flex items-center gap-2 ${bannerColor()}`}>
        <Clock className="h-4 w-4" />
        {bannerText()}
      </div>

      <div className="space-y-4">
        <Step
          label="Admin confirmed — ready for payout"
          date={deal.admin_confirmed_at}
          done={!!deal.admin_confirmed_at}
        />
        <Step
          label="Agent acknowledged commission"
          date={deal.agent_confirmed_at}
          done={!!deal.agent_confirmed_at}
        />
        <Step
          label="Commission paid"
          date={deal.commission_paid_at}
          done={isPaid}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        {canAdminConfirm && (
          <Button onClick={() => adminConfirm()} disabled={confirming}>
            {confirming ? "Confirming…" : "Confirm deal — ready for payout"}
          </Button>
        )}
        {canAgentConfirm && (
          <Button onClick={() => agentConfirm()} disabled={acknowledging}>
            {acknowledging ? "Acknowledging…" : "Acknowledge — I agree with commission"}
          </Button>
        )}
        {payoutReady && !isPaid && (
          <Button variant="default" onClick={onRecordPayout}>
            Record payout
          </Button>
        )}
      </div>
    </div>
  );
}
