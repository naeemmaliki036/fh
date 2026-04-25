"use client";

import { use, useState, useCallback } from "react";
import { publicDocumentRequestRepository } from "@/lib/api/repositories";
import { PublicVerifyForm } from "@/components/molecules/PublicVerifyForm";
import { PublicItemCard } from "@/components/molecules/PublicItemCard";
import { DocRequestStatusBadge } from "@/components/atoms/DocRequestStatusBadge";
import { useQuery } from "@tanstack/react-query";
import type { PublicDocumentRequestResponse } from "@/lib/types/public-document-request";

interface PageProps {
  params: Promise<{ token: string }>;
}

interface VerifyError {
  message: string;
  attemptsLeft?: number;
  locked?: boolean;
}

export default function PublicDocumentRequestPage({ params }: PageProps): React.ReactElement {
  const { token } = use(params);
  const [jwt, setJwt] = useState<string | null>(null);
  const [verifying, setVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState<VerifyError | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);

  const { data, isLoading, error } = useQuery({
    queryKey: ["public-doc-request", token, jwt, refreshKey],
    queryFn: (): Promise<PublicDocumentRequestResponse> =>
      publicDocumentRequestRepository.get(token, jwt ?? undefined),
    retry: false,
  });

  const refetch = useCallback((): void => setRefreshKey(k => k + 1), []);

  const handleVerify = async (code: string): Promise<void> => {
    setVerifying(true);
    setVerifyError(null);
    try {
      const res = await publicDocumentRequestRepository.verify(token, code);
      setJwt(res.access_token);
    } catch (err) {
      // axios error — extract attempts_left from response
      const axiosErr = err as { response?: { status: number; data: { detail: string; attempts_left?: number } } };
      const status = axiosErr.response?.status;
      const detail = axiosErr.response?.data?.detail ?? "Verification failed";
      const attemptsLeft = axiosErr.response?.data?.attempts_left;
      setVerifyError({
        message: detail,
        attemptsLeft,
        locked: status === 423,
      });
    } finally {
      setVerifying(false);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center space-y-2">
        <p className="font-semibold">Link not found</p>
        <p className="text-sm text-muted-foreground">This document request link is invalid or has been removed.</p>
      </div>
    );
  }

  const isTerminal = data.status === "expired" || data.status === "canceled";
  const isComplete = data.status === "complete";

  if (isTerminal) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center space-y-3">
        <DocRequestStatusBadge status={data.status} />
        <p className="font-semibold">{data.status === "expired" ? "Link expired" : "Request canceled"}</p>
        <p className="text-sm text-muted-foreground">
          {data.status === "expired"
            ? "This document request has expired. Contact your agent for a new link."
            : "This document request has been canceled by your agent."}
        </p>
      </div>
    );
  }

  if (isComplete) {
    return (
      <div className="rounded-xl border bg-card p-6 text-center space-y-4">
        <div className="text-5xl">✓</div>
        <p className="text-xl font-semibold">You&apos;re all done!</p>
        <p className="text-sm text-muted-foreground">
          All documents have been submitted. {data.tenant_name} will review them shortly.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-xl font-semibold">{data.title}</h1>
        <p className="text-sm text-muted-foreground">{data.tenant_name}</p>
        {data.instructions && (
          <p className="text-sm text-muted-foreground mt-2 rounded-md bg-muted/40 px-3 py-2">
            {data.instructions}
          </p>
        )}
      </div>

      {!data.verified || !jwt ? (
        <>
          {/* Locked preview of items */}
          <div className="space-y-2 opacity-60 pointer-events-none">
            {data.items.map(item => (
              <PublicItemCard
                key={item.id}
                item={item}
                token={token}
                jwt=""
                onUploadSuccess={refetch}
                isLocked
              />
            ))}
          </div>

          <PublicVerifyForm
            tenantName={data.tenant_name}
            isPending={verifying}
            error={verifyError}
            onSubmit={handleVerify}
          />
        </>
      ) : (
        <>
          <div className="space-y-3">
            {data.items.map(item => (
              <PublicItemCard
                key={item.id}
                item={item}
                token={token}
                jwt={jwt}
                onUploadSuccess={refetch}
                isLocked={false}
              />
            ))}
          </div>

          <div className="text-xs text-muted-foreground text-center">
            {data.items.filter(i => i.uploaded).length}/{data.items.length} documents submitted
          </div>
        </>
      )}
    </div>
  );
}
