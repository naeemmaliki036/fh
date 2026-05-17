import type { AxiosInstance } from "axios";
import type {
  ConsumerAuthResponse,
  ConsumerResponse,
  ConsumerUpdateRequest,
  RequestOtpRequest,
  RequestOtpResponse,
  VerifyOtpRequest,
  ConsumerListingItem,
  ConsumerListingCreateRequest,
  ConsumerListingUpdateRequest,
  ConsumerListingMarkStatusRequest,
  ConsumerListingsResponse,
  FavoriteToggleResponse,
  ConsumerListingLeadRequest,
  ConsumerListingLeadResponse,
  MarketplaceListingsResponse,
} from "@fh/portal-types";

const BASE = "/consumer";

// ---- Auth ----

export async function requestOtp(
  c: AxiosInstance,
  body: RequestOtpRequest,
): Promise<RequestOtpResponse> {
  const res = await c.post<RequestOtpResponse>(`${BASE}/auth/request-otp`, body);
  return res.data;
}

export async function verifyOtp(
  c: AxiosInstance,
  body: VerifyOtpRequest,
): Promise<ConsumerAuthResponse> {
  const res = await c.post<ConsumerAuthResponse>(`${BASE}/auth/verify-otp`, body);
  return res.data;
}

export async function googleAuth(c: AxiosInstance): Promise<void> {
  await c.post(`${BASE}/auth/google`);
}

// ---- Profile ----

export async function getConsumerMe(c: AxiosInstance): Promise<ConsumerResponse> {
  const res = await c.get<ConsumerResponse>(`${BASE}/me`);
  return res.data;
}

export async function updateConsumerMe(
  c: AxiosInstance,
  body: ConsumerUpdateRequest,
): Promise<ConsumerResponse> {
  const res = await c.patch<ConsumerResponse>(`${BASE}/me`, body);
  return res.data;
}

// ---- My Listings ----

export async function getMyListings(
  c: AxiosInstance,
  page?: number,
  pageSize?: number,
): Promise<ConsumerListingsResponse> {
  const res = await c.get<ConsumerListingsResponse>(`${BASE}/me/listings`, {
    params: { page, page_size: pageSize },
  });
  return res.data;
}

export async function createMyListing(
  c: AxiosInstance,
  body: ConsumerListingCreateRequest,
): Promise<ConsumerListingItem> {
  const res = await c.post<ConsumerListingItem>(`${BASE}/me/listings`, body);
  return res.data;
}

export async function updateMyListing(
  c: AxiosInstance,
  id: string,
  body: ConsumerListingUpdateRequest,
): Promise<ConsumerListingItem> {
  const res = await c.patch<ConsumerListingItem>(`${BASE}/me/listings/${id}`, body);
  return res.data;
}

export async function deleteMyListing(c: AxiosInstance, id: string): Promise<void> {
  await c.delete(`${BASE}/me/listings/${id}`);
}

export async function markListingStatus(
  c: AxiosInstance,
  id: string,
  body: ConsumerListingMarkStatusRequest,
): Promise<ConsumerListingItem> {
  const res = await c.post<ConsumerListingItem>(
    `${BASE}/me/listings/${id}/mark-status`,
    body,
  );
  return res.data;
}

// ---- Favorites ----

export async function toggleFavorite(
  c: AxiosInstance,
  listingId: string,
): Promise<FavoriteToggleResponse> {
  const res = await c.post<FavoriteToggleResponse>(
    `${BASE}/me/favorites/${listingId}`,
  );
  return res.data;
}

export async function getMyFavorites(
  c: AxiosInstance,
  page?: number,
  pageSize?: number,
): Promise<MarketplaceListingsResponse> {
  const res = await c.get<MarketplaceListingsResponse>(`${BASE}/me/favorites`, {
    params: { page, page_size: pageSize },
  });
  return res.data;
}

// ---- Consumer Inquiry (public, no auth) ----

export async function submitConsumerInquiry(
  c: AxiosInstance,
  listingId: string,
  body: ConsumerListingLeadRequest,
): Promise<ConsumerListingLeadResponse> {
  const res = await c.post<ConsumerListingLeadResponse>(
    `/public/listings/${listingId}/consumer-inquiry`,
    body,
  );
  return res.data;
}
