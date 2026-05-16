export const queryKeys = {
  marketplace: {
    listings: (params?: Record<string, unknown>) =>
      ["marketplace", "listings", params] as const,
    listing: (id: string) => ["marketplace", "listing", id] as const,
    agencies: (page?: number, pageSize?: number, q?: string) =>
      ["marketplace", "agencies", { page, pageSize, q }] as const,
    agency: (slug: string) => ["marketplace", "agency", slug] as const,
    agencyListings: (slug: string, params?: Record<string, unknown>) =>
      ["marketplace", "agency", slug, "listings", params] as const,
    stats: ["marketplace", "stats"] as const,
    featured: ["marketplace", "featured"] as const,
  },
} as const;
