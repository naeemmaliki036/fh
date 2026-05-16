"use client";

import { useState } from "react";
import { Globe, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useMarketplaceCountries } from "@/hooks/queries/useMarketplaceCountries";
import {
  useCreateMarketplaceCountry,
  useUpdateMarketplaceCountry,
  useDeleteMarketplaceCountry,
  useReorderMarketplaceCountries,
} from "@/hooks/mutations/useMarketplaceCountryMutations";
import type { MarketplaceCountry } from "@/lib/types";
import { CountriesTable } from "./_components/CountriesTable";
import { CountryFormDialog } from "./_components/CountryFormDialog";
import { DeleteCountryDialog } from "./_components/DeleteCountryDialog";

export default function MarketplaceCountriesPage(): React.ReactElement {
  const { data, isLoading } = useMarketplaceCountries();
  const items = data?.items ?? [];

  const createMutation = useCreateMarketplaceCountry();
  const updateMutation = useUpdateMarketplaceCountry();
  const deleteMutation = useDeleteMarketplaceCountry();
  const reorderMutation = useReorderMarketplaceCountries();

  const [addOpen, setAddOpen] = useState(false);
  const [editCountry, setEditCountry] = useState<MarketplaceCountry | null>(null);
  const [deleteCountry, setDeleteCountry] = useState<MarketplaceCountry | null>(null);

  function handleMoveUp(idx: number): void {
    if (idx === 0) return;
    const reordered = [...items];
    [reordered[idx - 1], reordered[idx]] = [reordered[idx], reordered[idx - 1]];
    reorderMutation.mutate(reordered.map((c) => c.id));
  }

  function handleMoveDown(idx: number): void {
    if (idx === items.length - 1) return;
    const reordered = [...items];
    [reordered[idx], reordered[idx + 1]] = [reordered[idx + 1], reordered[idx]];
    reorderMutation.mutate(reordered.map((c) => c.id));
  }

  function handleToggleEnabled(country: MarketplaceCountry): void {
    updateMutation.mutate({ id: country.id, data: { enabled: !country.enabled } });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3">
          <Globe className="h-5 w-5 text-primary mt-0.5" />
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">Marketplace countries</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Countries shown in the PropertyPoint country selector. Disable to hide without deleting.
            </p>
          </div>
        </div>
        <Button onClick={() => setAddOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Add country
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading...</p>
      ) : (
        <CountriesTable
          items={items}
          isReordering={reorderMutation.isPending}
          onMoveUp={handleMoveUp}
          onMoveDown={handleMoveDown}
          onToggleEnabled={handleToggleEnabled}
          onEdit={(c) => setEditCountry(c)}
          onDelete={(c) => setDeleteCountry(c)}
        />
      )}

      <CountryFormDialog
        mode="add"
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onSubmit={(data) => {
          createMutation.mutate(data, { onSuccess: () => setAddOpen(false) });
        }}
        isPending={createMutation.isPending}
      />

      {editCountry && (
        <CountryFormDialog
          mode="edit"
          open={editCountry !== null}
          onClose={() => setEditCountry(null)}
          country={editCountry}
          onSubmit={(data) => {
            updateMutation.mutate(
              { id: editCountry.id, data },
              { onSuccess: () => setEditCountry(null) },
            );
          }}
          isPending={updateMutation.isPending}
        />
      )}

      <DeleteCountryDialog
        country={deleteCountry}
        onClose={() => setDeleteCountry(null)}
        onConfirm={(id) => {
          deleteMutation.mutate(id, { onSuccess: () => setDeleteCountry(null) });
        }}
        isPending={deleteMutation.isPending}
      />
    </div>
  );
}
