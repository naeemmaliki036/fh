import { apiClient } from "../client";
import type { ClosedDealsParams, ClosedDealsResponse } from "@/lib/types/deal";

class ReportsRepository {
  private readonly basePath = "/reports";

  async getClosedDeals(params?: ClosedDealsParams): Promise<ClosedDealsResponse> {
    const res = await apiClient.get<ClosedDealsResponse>(`${this.basePath}/closed-deals`, {
      params: { ...params, format: "json" },
    });
    return res.data;
  }

  /**
   * Triggers a CSV download in the browser without leaking the auth token
   * into a URL. Fetches as a blob through the authenticated apiClient, then
   * synthesises a download link.
   */
  async downloadClosedDealsCsv(
    params?: Omit<ClosedDealsParams, "format" | "page" | "page_size">,
  ): Promise<void> {
    const res = await apiClient.get<Blob>(`${this.basePath}/closed-deals`, {
      params: { ...params, format: "csv" },
      responseType: "blob",
    });
    const blob = new Blob([res.data], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `closed-deals-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }
}

export const reportsRepository = new ReportsRepository();
