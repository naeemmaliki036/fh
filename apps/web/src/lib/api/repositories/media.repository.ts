import { BaseRepository } from "./base.repository";
import type { Media, MediaUpdateRequest } from "@/lib/types/media";

export class MediaRepository extends BaseRepository<Media, never, MediaUpdateRequest> {
  protected readonly basePath = "/media";

  override async update(id: string, body: MediaUpdateRequest): Promise<Media> {
    const res = await this.client.patch<Media>(`${this.basePath}/${id}`, body);
    return res.data;
  }

  override async delete(id: string): Promise<void> {
    await this.client.delete(`${this.basePath}/${id}`);
  }
}

export const mediaRepository = new MediaRepository();
