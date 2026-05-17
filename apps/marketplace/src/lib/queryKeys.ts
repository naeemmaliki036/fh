export const queryKeys = {
  marketplace: {
    countries: ["marketplace", "countries"] as const,
    listings: (params?: Record<string, unknown>) =>
      ["marketplace", "listings", params] as const,
    listing: (id: string) => ["marketplace", "listing", id] as const,
    agencies: (page?: number, pageSize?: number, q?: string, country?: string) =>
      ["marketplace", "agencies", { page, pageSize, q, country }] as const,
    agency: (slug: string) => ["marketplace", "agency", slug] as const,
    agencyListings: (slug: string, params?: Record<string, unknown>) =>
      ["marketplace", "agency", slug, "listings", params] as const,
    stats: (country?: string) => ["marketplace", "stats", country] as const,
    featured: (country?: string) => ["marketplace", "featured", country] as const,
    agents: (params?: Record<string, unknown>) =>
      ["marketplace", "agents", params] as const,
  },
  consumer: {
    me: ["consumer", "me"] as const,
    myListings: (page?: number) => ["consumer", "my-listings", page] as const,
    myFavorites: (page?: number) => ["consumer", "my-favorites", page] as const,
    listingMedia: (id: string) => ["consumer", "listing-media", id] as const,
  },
} as const;
