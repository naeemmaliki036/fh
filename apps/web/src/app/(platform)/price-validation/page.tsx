"use client";

import { useState } from "react";
import { DollarSign, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { usePriceValidationRules } from "@/hooks/queries/usePriceValidationRules";
import {
  useCreatePriceValidationRule,
  useUpdatePriceValidationRule,
  useDeletePriceValidationRule,
  useReorderPriceValidationRules,
} from "@/hooks/mutations/usePriceValidationMutations";
import type { PriceValidationRule } from "@/lib/types";
import { PriceValidationRulesTable } from "./_components/PriceValidationRulesTable";
import { PriceValidationRuleDialog } from "./_components/PriceValidationRuleDialog";
import { DeleteRuleDialog } from "./_components/DeleteRuleDialog";
import { PreviewPanel } from "./_components/PreviewPanel";

export default function PriceValidationPage(): React.ReactElement {
  const { data, isLoading } = usePriceValidationRules();
  const items = data?.items ?? [];

  const createMutation = useCreatePriceValidationRule();
  const updateMutation = useUpdatePriceValidationRule();
  const deleteMutation = useDeletePriceValidationRule();
  const reorderMutation = useReorderPriceValidationRules();

  const [addOpen, setAddOpen] = useState(false);
  const [editRule, setEditRule] = useState<PriceValidationRule | null>(null);
  const [deleteRule, setDeleteRule] = useState<PriceValidationRule | null>(null);

  function handleMoveUp(idx: number): void {
    if (idx === 0) return;
    const reordered = [...items];
    [reordered[idx - 1], reordered[idx]] = [reordered[idx], reordered[idx - 1]];
    reorderMutation.mutate(reordered.map((r) => r.id));
  }

  function handleMoveDown(idx: number): void {
    if (idx === items.length - 1) return;
    const reordered = [...items];
    [reordered[idx], reordered[idx + 1]] = [reordered[idx + 1], reordered[idx]];
    reorderMutation.mutate(reordered.map((r) => r.id));
  }

  function handleToggleEnabled(rule: PriceValidationRule): void {
    updateMutation.mutate({ id: rule.id, data: { enabled: !rule.enabled } });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <DollarSign className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Price validation rules</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Define min/max price limits by country, city, purpose, and currency. Rules are applied from most-specific to global.
            </p>
          </div>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add rule
        </Button>
      </div>

      <PreviewPanel />

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <PriceValidationRulesTable
          items={items}
          isReordering={reorderMutation.isPending}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onToggleEnabled={handleToggleEnabled}
          onEdit={(r) => setEditRule(r)}
          onDelete={(r) => setDeleteRule(r)}
        />
      )}

      <PriceValidationRuleDialog
        mode="create"
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={(data) => {
          createMutation.mutate(data, { onSuccess: () => setAddOpen(false) });
        }}
        isPending={createMutation.isPending}
      />

      {editRule && (
        <PriceValidationRuleDialog
          mode="edit"
          open={editRule !== null}
          onClose={() => setEditRule(null)}
          rule={editRule}
          onSubmit={(data) => {
            updateMutation.mutate(
              { id: editRule.id, data },
              { onSuccess: () => setEditRule(null) },
            );
          }}
          isPending={updateMutation.isPending}
        />
      )}

      <DeleteRuleDialog
        rule={deleteRule}
        onClose={() => setDeleteRule(null)}
        onConfirm={(id) => {
          deleteMutation.mutate(id, { onSuccess: () => setDeleteRule(null) });
        }}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
