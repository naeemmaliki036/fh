export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
    platformMe: ["auth", "platform-me"] as const,
  },
  tenants: {
    all: ["tenants"] as const,
    list: (status?: string) => ["tenants", "list", status] as const,
    adminList: (params?: Record<string, unknown>) => ["tenants", "admin-list", params] as const,
    detail: (id: string) => ["tenants", id] as const,
    adminDetail: (id: string) => ["tenants", "admin", id] as const,
    my: ["tenants", "me"] as const,
  },
  platformUsers: {
    all: ["platform-users"] as const,
    list: ["platform-users", "list"] as const,
  },
  users: {
    all: ["users"] as const,
    list: ["users", "list"] as const,
    detail: (id: string) => ["users", id] as const,
    me: ["users", "me"] as const,
    eligibleReviewers: ["users", "eligible-reviewers"] as const,
  },
  agents: {
    all: ["agents"] as const,
    list: (params?: Record<string, unknown>) => ["agents", "list", params] as const,
    detail: (id: string) => ["agents", id] as const,
    documents: (id: string) => ["agents", id, "documents"] as const,
  },
  customers: {
    all: ["customers"] as const,
    list: (params?: Record<string, unknown>) => ["customers", "list", params] as const,
    detail: (id: string) => ["customers", id] as const,
    documents: (id: string) => ["customers", id, "documents"] as const,
  },
  privateDocuments: {
    all: ["private-documents"] as const,
    pending: (params?: Record<string, unknown>) => ["private-documents", "pending", params] as const,
  },
  listingInterestedCustomers: {
    all: ["listing-interested-customers"] as const,
    list: (listingId: string) => ["listing-interested-customers", listingId] as const,
  },
  properties: {
    all: ["properties"] as const,
    list: (params?: Record<string, unknown>) => ["properties", "list", params] as const,
    detail: (id: string) => ["properties", id] as const,
    media: (id: string) => ["properties", id, "media"] as const,
    listings: (id: string) => ["properties", id, "listings"] as const,
    agents: (id: string) => ["properties", id, "agents"] as const,
    amenityCatalog: ["properties", "amenity-catalog"] as const,
  },
  listings: {
    all: ["listings"] as const,
    list: (params?: Record<string, unknown>) => ["listings", "list", params] as const,
    detail: (id: string) => ["listings", id] as const,
    priceHistory: (id: string) => ["listings", id, "price-history"] as const,
    documents: (id: string) => ["listings", id, "documents"] as const,
    pendingReviews: (reviewerId: string) => ["listings", "pending-reviews", reviewerId] as const,
    interestedCustomers: (id: string) => ["listings", id, "interested-customers"] as const,
  },
  auditLogs: {
    forEntity: (entityType: string, entityId: string) =>
      ["audit-logs", entityType, entityId] as const,
  },
  leads: {
    all: ["leads"] as const,
    list: (params?: Record<string, unknown>) => ["leads", "list", params] as const,
    detail: (id: string) => ["leads", id] as const,
    activities: (id: string) => ["leads", id, "activities"] as const,
  },
  docRequests: {
    all: ["doc-requests"] as const,
    list: (params?: Record<string, unknown>) => ["doc-requests", "list", params] as const,
    detail: (id: string) => ["doc-requests", id] as const,
  },
  deals: {
    all: ["deals"] as const,
    list: (params?: Record<string, unknown>) => ["deals", "list", params] as const,
    detail: (id: string) => ["deals", id] as const,
  },
  notifications: {
    all: ["notifications"] as const,
    list: (params?: Record<string, unknown>) => ["notifications", "list", params] as const,
    unreadCount: ["notifications", "unread-count"] as const,
  },
  publicSite: {
    profile: (slug: string) => ["public-site", slug, "profile"] as const,
    listings: (slug: string, params?: Record<string, unknown>) =>
      ["public-site", slug, "listings", params] as const,
    listing: (slug: string, id: string) => ["public-site", slug, "listing", id] as const,
    agents: (slug: string) => ["public-site", slug, "agents"] as const,
    similar: (slug: string, listingId: string) =>
      ["public-site", slug, "similar", listingId] as const,
    stats: (slug: string) => ["public-site", slug, "stats"] as const,
  },
  tenantPublicSite: {
    settings: ["tenant-public-site", "settings"] as const,
  },
  emailTemplates: {
    all: ["email-templates"] as const,
    list: (params?: Record<string, unknown>) => ["email-templates", "list", params] as const,
    detail: (id: string) => ["email-templates", id] as const,
  },
  emailOutbox: {
    all: ["email-outbox"] as const,
    list: (params?: Record<string, unknown>) => ["email-outbox", "list", params] as const,
    detail: (id: string) => ["email-outbox", id] as const,
  },
  leaderboard: {
    all: ["leaderboard"] as const,
    agents: (params?: Record<string, unknown>) => ["leaderboard", "agents", params] as const,
  },
  offMarketReasons: {
    all: ["off-market-reasons"] as const,
  },
  openHouses: {
    list: (listingId: string, includePast?: boolean) =>
      ["open-houses", listingId, { includePast }] as const,
  },
  reports: {
    closedDeals: (params?: Record<string, unknown>) => ["reports", "closed-deals", params] as const,
  },
  marketplaceCountries: {
    all: ["marketplace-countries"] as const,
    list: ["marketplace-countries", "list"] as const,
  },
  consumerListings: {
    queue: (params?: Record<string, unknown>) =>
      ["consumer-listings", "queue", params] as const,
    detail: (id: string) => ["consumer-listings", "detail", id] as const,
    pendingCount: ["consumer-listings", "pending-count"] as const,
  },
  locations: {
    tree: ["locations", "tree"] as const,
    countries: ["locations", "countries"] as const,
    adminCountries: ["locations", "admin", "countries"] as const,
    cities: (countryId: string) => ["locations", "cities", countryId] as const,
    adminCities: (countryId: string) => ["locations", "admin", "cities", countryId] as const,
    areas: (cityId: string) => ["locations", "areas", cityId] as const,
    adminAreas: (cityId: string) => ["locations", "admin", "areas", cityId] as const,
  },
} as const;
