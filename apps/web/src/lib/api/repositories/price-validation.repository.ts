import { platformApiClient } from "../client";
import type {
  PriceValidationRule,
  PriceValidationRuleListResponse,
  PriceValidationRuleCreateRequest,
  PriceValidationRuleUpdateRequest,
  PriceValidationPreviewResponse,
  PriceValidationPreviewParams,
} from "@/lib/types/price-validation";

const BASE = "/admin/price-validation-rules";

class PriceValidationRepository {
  async list(): Promise<PriceValidationRuleListResponse> {
    const res = await platformApiClient.get<PriceValidationRuleListResponse>(BASE);
    return res.data;
  }

  async create(data: PriceValidationRuleCreateRequest): Promise<PriceValidationRule> {
    const res = await platformApiClient.post<PriceValidationRule>(BASE, data);
    return res.data;
  }

  async update(id: string, data: PriceValidationRuleUpdateRequest): Promise<PriceValidationRule> {
    const res = await platformApiClient.patch<PriceValidationRule>(`${BASE}/${id}`, data);
    return res.data;
  }

  async remove(id: string): Promise<void> {
    await platformApiClient.delete(`${BASE}/${id}`);
  }

  async reorder(orderedIds: string[]): Promise<void> {
    await platformApiClient.post(`${BASE}/reorder`, { ordered_ids: orderedIds });
  }

  async preview(params: PriceValidationPreviewParams): Promise<PriceValidationPreviewResponse> {
    const res = await platformApiClient.get<PriceValidationPreviewResponse>(`${BASE}/preview`, {
      params,
    });
    return res.data;
  }
}

export const priceValidationRepository = new PriceValidationRepository();
