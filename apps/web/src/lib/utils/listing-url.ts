/**
 * Utilities for building and parsing SEO-friendly public listing URL handles.
 * Handle format: {title-slug}-{uuid}
 * Example: 6br-signature-villa-in-palm-jumeirah-c81d204f-937a-4572-b644-a972a7395e2c
 */

const MAX_SLUG_LENGTH = 80;
const UUID_RE =
  /[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/i;

/**
 * Build a public URL handle by combining a slugified title with the listing UUID.
 * Falls back to the bare UUID when title is null/empty.
 */
export function listingHandle(title: string | null, id: string): string {
  const slug = (title ?? "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, MAX_SLUG_LENGTH);
  return slug ? `${slug}-${id}` : id;
}

/**
 * Parse the trailing UUID out of a handle.
 * Works for both the new SEO handle and old bare-UUID URLs.
 */
export function extractListingId(handle: string): string {
  const m = handle.match(UUID_RE);
  return m ? m[0] : handle;
}
