"use client";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import type { PriceValidationRule } from "@/lib/types";

interface Props {
  rule: PriceValidationRule | null;
  onClose: () => void;
  onConfirm: (id: string) => void;
  isPending: boolean;
}

export function DeleteRuleDialog({ rule, onClose, onConfirm, isPending }: Props): React.ReactElement {
  const scopeLabel = rule
    ? rule.country
      ? rule.city
        ? `${rule.country} / ${rule.city}`
        : rule.country
      : "Global"
    : "";

  return (
    <Dialog open={rule !== null} onOpenChange={(v) => { if (!v) onClose(); }}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle>Delete price validation rule</DialogTitle>
          <DialogDescription>
            {rule
              ? `Delete the ${rule.currency} rule for ${scopeLabel}? Price validation for this scope will no longer be enforced by this rule.`
              : ""}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isPending}>Cancel</Button>
          <Button
            variant="destructive"
            disabled={isPending || !rule}
            onClick={() => { if (rule) onConfirm(rule.id); }}
          >
            {isPending ? "Deleting..." : "Delete"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
