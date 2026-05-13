import { platformApiClient } from "../client";
import type {
  PlatformUser,
  PlatformUserCreateRequest,
  PlatformUserUpdateRequest,
  PlatformUserResetPasswordRequest,
  PlatformUserListResponse,
} from "@/lib/types";

class PlatformUsersRepository {
  private readonly basePath = "/platform/users";

  async list(): Promise<PlatformUserListResponse> {
    const res = await platformApiClient.get<PlatformUserListResponse>(this.basePath);
    return res.data;
  }

  async create(data: PlatformUserCreateRequest): Promise<PlatformUser> {
    const res = await platformApiClient.post<PlatformUser>(this.basePath, data);
    return res.data;
  }

  async update(id: string, data: PlatformUserUpdateRequest): Promise<PlatformUser> {
    const res = await platformApiClient.patch<PlatformUser>(`${this.basePath}/${id}`, data);
    return res.data;
  }

  async resetPassword(id: string, data: PlatformUserResetPasswordRequest): Promise<void> {
    await platformApiClient.post(`${this.basePath}/${id}/reset-password`, data);
  }
}

export const platformUsersRepository = new PlatformUsersRepository();
