/**
 * Repository smoke tests + AgentRepository round-trip with mocked axios.
 *
 * Covers:
 * 1. Each repository instantiates without throwing.
 * 2. Each is exported as a singleton from repositories/index.ts.
 * 3. BaseRepository URL composition (getById hits /<basePath>/<id>).
 * 4. AgentRepository CRUD methods call the right URL + method.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import type { AxiosInstance } from "axios";

// ── Repository singleton imports ─────────────────────────────────────────────
import {
  authRepository,
  tenantRepository,
  userRepository,
  agentRepository,
  customerRepository,
  propertyRepository,
  listingRepository,
  mediaRepository,
  leadRepository,
  documentRequestRepository,
  dealRepository,
  publicDocumentRequestRepository,
} from "@/lib/api/repositories/index";
import { AgentRepository } from "@/lib/api/repositories/agent.repository";
import type { Agent } from "@/lib/types/agent";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeAxiosMock() {
  return {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
    delete: vi.fn(),
    postForm: vi.fn(),
  } as unknown as AxiosInstance;
}

const MOCK_AGENT: Agent = {
  id: "agent-uuid-1",
  tenant_id: "tenant-uuid-1",
  full_name: "Test Agent",
  email: "agent@test.com",
  phone: null,
  photo_url: null,
  photo_key: null,
  license_id: null,
  license_expiry_at: null,
  status: "active",
  default_commission_type: "percentage",
  default_commission_value: "2.5",
  linked_user_id: null,
  created_at: "2024-01-01T00:00:00Z",
  updated_at: "2024-01-01T00:00:00Z",
};

// ---------------------------------------------------------------------------
// 1. Singleton smoke test
// ---------------------------------------------------------------------------

describe("Repository singletons", () => {
  const singletons = [
    ["authRepository", authRepository],
    ["tenantRepository", tenantRepository],
    ["userRepository", userRepository],
    ["agentRepository", agentRepository],
    ["customerRepository", customerRepository],
    ["propertyRepository", propertyRepository],
    ["listingRepository", listingRepository],
    ["mediaRepository", mediaRepository],
    ["leadRepository", leadRepository],
    ["documentRequestRepository", documentRequestRepository],
    ["dealRepository", dealRepository],
    ["publicDocumentRequestRepository", publicDocumentRequestRepository],
  ] as const;

  it.each(singletons)("%s is exported and non-null", (_name, repo) => {
    expect(repo).toBeDefined();
    expect(repo).not.toBeNull();
  });
});

// ---------------------------------------------------------------------------
// 2. BaseRepository URL composition
// ---------------------------------------------------------------------------

describe("BaseRepository URL composition", () => {
  let axiosMock: ReturnType<typeof makeAxiosMock>;
  let repo: AgentRepository;

  beforeEach(() => {
    axiosMock = makeAxiosMock();
    repo = new AgentRepository(axiosMock);
    vi.mocked(axiosMock.get).mockResolvedValue({ data: MOCK_AGENT });
    vi.mocked(axiosMock.post).mockResolvedValue({ data: MOCK_AGENT });
    vi.mocked(axiosMock.patch).mockResolvedValue({ data: MOCK_AGENT });
    vi.mocked(axiosMock.delete).mockResolvedValue({ data: undefined });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("getById calls GET /agents/<id>", async () => {
    await repo.getById("agent-uuid-1");
    expect(axiosMock.get).toHaveBeenCalledWith("/agents/agent-uuid-1");
  });

  it("getAll calls GET /agents", async () => {
    vi.mocked(axiosMock.get).mockResolvedValue({ data: [MOCK_AGENT] });
    await repo.getAll();
    expect(axiosMock.get).toHaveBeenCalledWith("/agents");
  });

  it("create calls POST /agents with body", async () => {
    const payload = {
      full_name: "New Agent",
      email: "new@agents.com",
      default_commission_type: "percentage" as const,
      default_commission_value: 3,
    };
    await repo.create(payload);
    expect(axiosMock.post).toHaveBeenCalledWith("/agents", payload);
  });

  it("update calls PATCH /agents/<id> with body", async () => {
    const patch = { full_name: "Updated Name" };
    await repo.update("agent-uuid-1", patch);
    expect(axiosMock.patch).toHaveBeenCalledWith("/agents/agent-uuid-1", patch);
  });

  it("delete calls DELETE /agents/<id>", async () => {
    await repo.delete("agent-uuid-1");
    expect(axiosMock.delete).toHaveBeenCalledWith("/agents/agent-uuid-1");
  });
});

// ---------------------------------------------------------------------------
// 3. AgentRepository extended methods
// ---------------------------------------------------------------------------

describe("AgentRepository extended methods", () => {
  let axiosMock: ReturnType<typeof makeAxiosMock>;
  let repo: AgentRepository;

  beforeEach(() => {
    axiosMock = makeAxiosMock();
    repo = new AgentRepository(axiosMock);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it("listAgents calls GET /agents with params", async () => {
    vi.mocked(axiosMock.get).mockResolvedValue({ data: { items: [], total: 0 } });
    await repo.listAgents({ status: "active", skip: 0, limit: 20 });
    expect(axiosMock.get).toHaveBeenCalledWith("/agents", {
      params: { status: "active", skip: 0, limit: 20 },
    });
  });

  it("deletePhoto calls DELETE /agents/<id>/photo", async () => {
    vi.mocked(axiosMock.delete).mockResolvedValue({ data: undefined });
    await repo.deletePhoto("agent-uuid-1");
    expect(axiosMock.delete).toHaveBeenCalledWith("/agents/agent-uuid-1/photo");
  });

  it("listDocuments calls GET /agents/<id>/documents", async () => {
    vi.mocked(axiosMock.get).mockResolvedValue({ data: { items: [], total: 0 } });
    await repo.listDocuments("agent-uuid-1");
    expect(axiosMock.get).toHaveBeenCalledWith("/agents/agent-uuid-1/documents");
  });

  it("getDownloadUrl calls GET /agents/<id>/documents/<docId>/download", async () => {
    vi.mocked(axiosMock.get).mockResolvedValue({ data: { url: "https://signed" } });
    await repo.getDownloadUrl("agent-uuid-1", "doc-uuid-1");
    expect(axiosMock.get).toHaveBeenCalledWith(
      "/agents/agent-uuid-1/documents/doc-uuid-1/download",
    );
  });

  it("deleteDocument calls DELETE /agents/<id>/documents/<docId>", async () => {
    vi.mocked(axiosMock.delete).mockResolvedValue({ data: undefined });
    await repo.deleteDocument("agent-uuid-1", "doc-uuid-1");
    expect(axiosMock.delete).toHaveBeenCalledWith(
      "/agents/agent-uuid-1/documents/doc-uuid-1",
    );
  });
});
