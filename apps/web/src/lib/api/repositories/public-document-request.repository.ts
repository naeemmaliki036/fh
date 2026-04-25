import axios from "axios";
import type {
  PublicDocumentRequestResponse,
  VerifyResponse,
  UploadItemResponse,
} from "@/lib/types/public-document-request";

const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

/** Bare axios instance — no auth interceptors, no token injection. */
const http = axios.create({ baseURL: API_BASE, timeout: 30_000 });

export const publicDocumentRequestRepository = {
  async get(token: string, jwt?: string): Promise<PublicDocumentRequestResponse> {
    const headers: Record<string, string> = {};
    if (jwt) headers["Authorization"] = `Bearer ${jwt}`;
    const res = await http.get<PublicDocumentRequestResponse>(
      `/public/document-requests/${token}`,
      { headers },
    );
    return res.data;
  },

  async verify(token: string, code: string): Promise<VerifyResponse> {
    const res = await http.post<VerifyResponse>(
      `/public/document-requests/${token}/verify`,
      { code },
    );
    return res.data;
  },

  async upload(token: string, itemId: string, file: File, jwt: string): Promise<UploadItemResponse> {
    const form = new FormData();
    form.append("file", file);
    const res = await http.post<UploadItemResponse>(
      `/public/document-requests/${token}/items/${itemId}/upload`,
      form,
      { headers: { Authorization: `Bearer ${jwt}`, "Content-Type": "multipart/form-data" } },
    );
    return res.data;
  },
} as const;
