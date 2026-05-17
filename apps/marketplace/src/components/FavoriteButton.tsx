"use client";

import { Heart } from "lucide-react";
import { cn } from "@/lib/cn";
import { useConsumer } from "@/lib/consumer-context";
import { useToggleFavorite } from "@/hooks/mutations/useFavoriteMutations";
import { useAuthDialog } from "@/lib/auth-dialog-context";

interface FavoriteButtonProps {
  listingId: string;
}

export function FavoriteButton({ listingId }: FavoriteButtonProps): React.ReactElement {
  const { token, favoriteIds } = useConsumer();
  const isFavorited = favoriteIds.has(listingId);
  const { mutate, isPending } = useToggleFavorite();
  const { open } = useAuthDialog();

  function handleClick(e: React.MouseEvent): void {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      open({ mode: "login", reason: "Sign in to save favorites" });
      return;
    }
    mutate(listingId);
  }

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isPending}
      aria-label={isFavorited ? "Remove from favorites" : "Save to favorites"}
      className={cn(
        "flex h-8 w-8 items-center justify-center rounded-full bg-white/90 shadow transition hover:scale-110 disabled:opacity-60",
        isFavorited ? "text-rose-500" : "text-slate-400",
      )}
    >
      <Heart
        className="h-4 w-4"
        fill={isFavorited ? "currentColor" : "none"}
      />
    </button>
  );
}
