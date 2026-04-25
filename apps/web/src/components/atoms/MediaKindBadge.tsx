import { Badge } from "@/components/ui/badge";
import type { MediaKind } from "@/lib/types/media";

const LABELS: Record<MediaKind, string> = {
  image: "Image", video: "Video", floorplan: "Floorplan", brochure: "Brochure",
};

export function MediaKindBadge({ kind }: { kind: MediaKind }): React.ReactElement {
  return <Badge variant="outline">{LABELS[kind] ?? kind}</Badge>;
}
