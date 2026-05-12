import { BaseRepository } from "./base.repository";
import type {
  User,
  UserCreateRequest,
  UserUpdateRequest,
  UserListResponse,
  UserMeUpdateRequest,
  UserStatusChangeRequest,
} from "@/lib/types";

export class UserRepository extends BaseRepository<User, UserCreateRequest, UserUpdateRequest> {
  protected readonly basePath = "/users";

  async listUsers(): Promise<UserListResponse> {
    const res = await this.client.get<UserListResponse>(this.basePath);
    return res.data;
  }

  async getMe(): Promise<User> {
    const res = await this.client.get<User>(`${this.basePath}/me`);
    return res.data;
  }

  async updateMe(data: UserMeUpdateRequest): Promise<User> {
    const res = await this.client.patch<User>(`${this.basePath}/me`, data);
    return res.data;
  }

  async disableUser(id: string): Promise<void> {
    await this.client.delete(`${this.basePath}/${id}`);
  }

  async changeStatus(id: string, body: UserStatusChangeRequest): Promise<User> {
    const res = await this.client.patch<User>(`${this.basePath}/${id}/status`, body);
    return res.data;
  }
}

export const userRepository = new UserRepository();
