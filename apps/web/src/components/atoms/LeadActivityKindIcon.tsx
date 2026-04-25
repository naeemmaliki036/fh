import {
  MessageSquare,
  Phone,
  Eye,
  CheckCircle,
  DollarSign,
  ThumbsUp,
  ThumbsDown,
  ArrowRightLeft,
  UserCheck,
  Circle,
} from "lucide-react";
import type { LeadActivityKind } from "@/lib/types/lead-activity";

const ICON_MAP: Record<LeadActivityKind, React.ComponentType<{ className?: string }>> = {
  note:                MessageSquare,
  stage_changed:       ArrowRightLeft,
  assignment_changed:  UserCheck,
  contact_made:        Phone,
  viewing_scheduled:   Eye,
  viewing_completed:   CheckCircle,
  offer_made:          DollarSign,
  offer_accepted:      ThumbsUp,
  offer_rejected:      ThumbsDown,
  other:               Circle,
};

interface LeadActivityKindIconProps {
  kind: LeadActivityKind;
  className?: string;
}

export function LeadActivityKindIcon({ kind, className = "h-4 w-4" }: LeadActivityKindIconProps): React.ReactElement {
  const Icon = ICON_MAP[kind] ?? Circle;
  return <Icon className={className} />;
}
