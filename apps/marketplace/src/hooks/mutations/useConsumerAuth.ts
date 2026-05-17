import { useMutation, type UseMutationResult } from "@tanstack/react-query";
import { toast } from "sonner";
import { requestOtp, verifyOtp, googleAuth } from "@fh/api-client/src/consumer";
import { marketplaceApi } from "@/lib/api";
import { useConsumer } from "@/lib/consumer-context";
import type {
  RequestOtpRequest,
  RequestOtpResponse,
  VerifyOtpRequest,
  ConsumerAuthResponse,
} from "@fh/portal-types";

export function useRequestOtp(): UseMutationResult<RequestOtpResponse, Error, RequestOtpRequest> {
  return useMutation({
    mutationFn: (body: RequestOtpRequest) => requestOtp(marketplaceApi, body),
    onError: () => {
      toast.error("Failed to send OTP. Please try again.");
    },
  });
}

export function useVerifyOtp(): UseMutationResult<ConsumerAuthResponse, Error, VerifyOtpRequest> {
  const { signIn } = useConsumer();
  return useMutation({
    mutationFn: (body: VerifyOtpRequest) => verifyOtp(marketplaceApi, body),
    onSuccess: (data) => {
      signIn(data.access_token, data.consumer);
    },
    onError: () => {
      toast.error("Invalid code. Please try again.");
    },
  });
}

export function useGoogleAuth(): UseMutationResult<void, Error, void> {
  return useMutation({
    mutationFn: () => googleAuth(marketplaceApi),
    onError: () => {
      // Backend returns 501 — show coming soon
      toast.info("Google sign-in coming soon");
    },
    onSuccess: () => {
      toast.info("Google sign-in coming soon");
    },
  });
}

export function useSignOut(): () => void {
  const { signOut } = useConsumer();
  return signOut;
}
