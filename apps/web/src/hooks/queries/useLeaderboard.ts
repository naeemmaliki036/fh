"use client";

import { useQuery } from "@tanstack/react-query";
import { dealRepository } from "@/lib/api/repositories";
import type { LeaderboardResponse, LeaderboardPeriod } from "@/lib/types/deal";
import { queryKeys } from "../queryKeys";

interface LeaderboardParams {
  period: LeaderboardPeriod;
  from?: string;
  to?: string;
}

export function useLeaderboard(params: LeaderboardParams) {
  return useQuery({
    queryKey: queryKeys.leaderboard.agents(params as Record<string, unknown>),
    queryFn: (): Promise<LeaderboardResponse> => dealRepository.getLeaderboard(params),
    enabled: params.period !== "custom" || (!!params.from && !!params.to),
  });
}
