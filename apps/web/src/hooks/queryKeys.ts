export const queryKeys = {
  auth: {
    me: ["auth", "me"] as const,
    platformMe: ["auth", "platform-me"] as const,
  },
  tenants: {
    all: ["tenants"] as const,
    list: (status?: string) => ["tenants", "list", status] as const,
    detail: (id: string) => ["tenants", id] as const,
    my: ["tenants", "me"] as const,
  },
  users: {
    all: ["users"] as const,
    list: ["users", "list"] as const,
    detail: (id: string) => ["users", id] as const,
    me: ["users", "me"] as const,
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
  properties: {
    all: ["properties"] as const,
    list: (params?: Record<string, unknown>) => ["properties", "list", params] as const,
    detail: (id: string) => ["properties", id] as const,
    media: (id: string) => ["properties", id, "media"] as const,
    listings: (id: string) => ["properties", id, "listings"] as const,
  },
  listings: {
    all: ["listings"] as const,
    detail: (id: string) => ["listings", id] as const,
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
} as const;
